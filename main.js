import { join, dirname } from 'path';
import {
  Client,
  GatewayIntentBits,
  Collection,
  REST,
  Routes
} from 'discord.js';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import fs from 'fs';
import cron from 'node-cron';
import fetch from 'node-fetch';

config(); // Load .env

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ]
});

const prefix = process.env.PREFIX;
const commandChannelId = process.env.COMMAND_CHANNEL_ID;
const bypassRoles = process.env.BYPASS_ROLE_IDS?.split(',').map(id => id.trim()) || [];
const boosterRoleId = process.env.BOOSTER_ROLE_ID;
const adminRoleId = process.env.ADMIN_ROLE_ID;
const ownerId = process.env.OWNER_ID;

client.commands = new Collection();
const slashCommands = [];
const workingCommands = [];

const loadCommands = async (dir) => {
  const commandsPath = join(__dirname, dir);
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = join(commandsPath, file);
    const command = await import(`file://${filePath}`);
    if ('data' in command.default && 'execute' in command.default) {
      client.commands.set(command.default.data.name, command.default);
      slashCommands.push(command.default.data.toJSON());
      workingCommands.push(command.default.data.name);
      console.log(`✅ Loaded command: ${command.default.data.name}`);
    } else {
      console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
  }
};

// Load public commands
await loadCommands('commands/public');

// Load booster commands
await loadCommands('commands/booster');

// Load admin commands
await loadCommands('commands/admin');

// Load owner commands
await loadCommands('commands/owner');

async function dailyRandomPing() {
  try {
    const guild = await client.guilds.fetch(process.env.SERVER_GUILD);
    await guild.members.fetch();

    const members = guild.members.cache.filter(member => !member.user.bot);
    const randomMember = members.random();

    if (!randomMember) {
      console.log('No non-bot members found in the server.');
      return;
    }

    const response = await fetch('https://api.quotable.io/random');
    const data = await response.json();
    const randomMessage = data.content;

    const channel = await client.channels.fetch(process.env.RANDOM_PING_LOG);

    if (channel && channel.isTextBased()) {
      const sentMessage = await channel.send(`${randomMember} ${randomMessage}`);
      console.log(`Pinged ${randomMember.user.tag} with message: ${randomMessage}`);
    } else {
      console.error('Invalid channel for random ping log');
    }
  } catch (error) {
    console.error('Error in dailyRandomPing:', error);
  }
}

client.once('ready', async () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);

  // Register slash commands
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  try {
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.SERVER_GUILD),
      { body: slashCommands }
    );
    console.log('✅ Slash commands registered!');
  } catch (error) {
    console.error('❌ Failed to register slash commands:', error);
  }

  // Notify in channel with role mention
  try {
    const notifyChannel = await client.channels.fetch(process.env.NOTIFY_CHANNEL_ID);

    if (notifyChannel && notifyChannel.send) {
      let mention = '';
      if (process.env.NOTIFY_ROLE_ID) {
        mention = `<@&${process.env.NOTIFY_ROLE_ID}> `;
      }

      await notifyChannel.send({
        content: `${mention}🆕 Bot has been updated with the following commands:\n` +
          workingCommands.map(cmd => `✅ \`${cmd}\``).join('\n'),
        allowedMentions: {
          roles: [process.env.NOTIFY_ROLE_ID]
        }
      });
    }
  } catch (error) {
    console.error('❌ Failed to send notification message:', error);
  }

  // Schedule daily random ping at 10 AM EST
  cron.schedule('0 10 * * *', dailyRandomPing, {
    scheduled: true,
    timezone: "America/New_York"
  });

  console.log('✅ Daily random ping scheduled for 10 AM EST');
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    // Check for owner-only commands
    if (command.ownerOnly && interaction.user.id !== ownerId) {
      return interaction.reply({ content: "This command is only available to the bot owner.", ephemeral: true });
    }

    // Check for admin-only commands
    if (command.adminOnly && !interaction.member.roles.cache.has(adminRoleId)) {
      return interaction.reply({ content: "This command is only available to administrators.", ephemeral: true });
    }

    // Check for booster-only commands
    if (command.boosterOnly && !interaction.member.roles.cache.has(boosterRoleId)) {
      return interaction.reply({ content: "This command is only available to server boosters.", ephemeral: true });
    }

    await command.execute(interaction);
  } catch (error) {
    console.error('Error executing command:', error);
    const errorMessage = 'There was an error while executing this command!';
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: errorMessage, ephemeral: true });
    } else {
      await interaction.reply({ content: errorMessage, ephemeral: true });
    }
  }
});

client.login(process.env.DISCORD_TOKEN);