
import { config } from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import {
  Client,
  GatewayIntentBits,
  Collection,
  REST,
  Routes
} from 'discord.js';
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
  const category = dir.split('/').pop(); // 'public', 'booster', 'admin', 'owner'
  const commandsPath = join(__dirname, dir);

  // Check if the directory exists before trying to read it
  if (!fs.existsSync(commandsPath)) {
    console.log(`[INFO] Command directory not found, skipping: ${commandsPath}`);
    return;
  }

  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js') && !file.startsWith('_'));

  for (const file of commandFiles) {
    const filePath = join(commandsPath, file);
    const commandModule = await import(`file://${filePath}`);
    const command = commandModule.default;

    if (command && 'data' in command && 'execute' in command) {
      command.category = category; // Add category to the command object
      client.commands.set(command.data.name, command);
      slashCommands.push(command.data.toJSON());
      workingCommands.push(command.data.name);
      console.log(`✅ Loaded command: ${command.data.name}`);
    } else {
      console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property, or has no default export.`);
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
