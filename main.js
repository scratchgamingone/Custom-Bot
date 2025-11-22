
import { config } from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import {
  Client,
  GatewayIntentBits,
  Collection,
  REST,
  Routes,
  PermissionFlagsBits
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
  const commandFiles = (await fs.promises.readdir(join(__dirname, dir))).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = join(__dirname, dir, file);
    try {
      const command = (await import(`file://${filePath}`)).default;

      if (command && 'data' in command && 'execute' in command) {
        // Set permissions based on command properties
        if (command.ownerOnly) {
          command.data.setDefaultMemberPermissions(0); // Disables for everyone in a guild by default
          command.data.setDMPermission(false);
        } else if (command.adminOnly) {
          command.data.setDefaultMemberPermissions(PermissionFlagsBits.Administrator);
          command.data.setDMPermission(false);
        } else if (command.boosterOnly) {
          command.data.setDMPermission(false); // Boosters are guild-specific, so disable in DMs
        } else {
          // Public command
          command.data.setDMPermission(true);
        }

        client.commands.set(command.data.name, command);
        slashCommands.push(command.data.toJSON());
        workingCommands.push(command.data.name);
        console.log(`✅ Loaded command: ${command.data.name}`);
      } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property, or has no default export.`);
      }
    } catch (error) {
      console.error(`Error loading command ${filePath}:`, error);
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

// ... existing imports
import { trackedItems } from './commands/booster/amazonprice.js';
import cron from 'node-cron';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { EmbedBuilder } from 'discord.js';

// ... existing code

// Helper function to scrape Amazon product info (simplified for the cron job)
async function scrapeAmazonPrice(url) {
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
            }
        });
        if (!response.ok) return null;
        const html = await response.text();
        const $ = cheerio.load(html);
        const title = $('#productTitle').text().trim();
        const priceText = $('.a-price .a-offscreen').first().text().trim();
        return { title, priceText, url };
    } catch (error) {
        console.error(`Error scraping price for ${url}:`, error);
        return null;
    }
}

// Schedule a cron job to run every hour for Amazon price checks
cron.schedule('0 * * * *', async () => {
    console.log('Running hourly Amazon price check...');
    for (const [url, item] of trackedItems.entries()) {
        const product = await scrapeAmazonPrice(url);
        if (product && product.priceText && product.priceText !== item.lastPrice) {
            console.log(`Price change detected for ${product.title}. Old: ${item.lastPrice}, New: ${product.priceText}`);

            // Determine color and status based on price change
            const oldPriceNum = parseFloat(item.lastPrice.replace(/[^0-9.-]+/g, ""));
            const newPriceNum = parseFloat(product.priceText.replace(/[^0-9.-]+/g, ""));
            
            let color = 'Orange'; // Default for change
            let status = 'Price Changed';
            if (newPriceNum < oldPriceNum) {
                color = 'Green';
                status = 'On Sale!';
            } else if (newPriceNum > oldPriceNum) {
                color = 'Red';
                status = 'Price Increased';
            }

            const embed = new EmbedBuilder()
                .setTitle(product.title)
                .setURL(product.url)
                .setColor(color)
                .addFields(
                    { name: 'New Price', value: product.priceText, inline: true },
                    { name: 'Old Price', value: item.lastPrice, inline: true },
                    { name: 'Status', value: status, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: 'Price Update' });

            try {
                await fetch(item.webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ embeds: [embed] }),
                });
                // Update the stored price
                trackedItems.set(url, { ...item, lastPrice: product.priceText });
            } catch (error) {
                console.error(`Failed to send price update webhook for ${url}:`, error);
            }
        }
        // Add a small delay between requests to avoid being blocked
        await new Promise(resolve => setTimeout(resolve, 5000));
    }
    console.log('Finished Amazon price check.');
});


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

  // Channel lock check
  if (process.env.COMMAND_LOCK_ENABLED === 'true' && interaction.channelId !== process.env.COMMAND_CHANNEL_ID) {
      // Allow 'listofcommands' to be used anywhere
      if (interaction.commandName === 'listofcommands') {
          // Continue execution for listofcommands
      } else {
          return interaction.reply({
              content: `You can only use bot commands in the <#${process.env.COMMAND_CHANNEL_ID}> channel.`,
              ephemeral: true
          });
      }
  }

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
