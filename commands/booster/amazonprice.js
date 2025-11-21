
import { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } from 'discord.js';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { config } from 'dotenv';
import { promises as fs } from 'fs';
import path from 'path';

config(); // Load .env variables

const PRICE_CHECKER_CATEGORY_ID = process.env.PRICE_CHECKER_CATEGORY_ID;
const TRACKED_ITEMS_PATH = path.join(process.cwd(), 'tracked-items.json');

// In-memory store that is loaded from and saved to a file.
export const trackedItems = new Map();

// --- New Functions to Manage File I/O ---

// Function to load items from the JSON file into the map
async function loadTrackedItems() {
    try {
        const data = await fs.readFile(TRACKED_ITEMS_PATH, 'utf8');
        const items = JSON.parse(data);
        for (const [key, value] of Object.entries(items)) {
            trackedItems.set(key, value);
        }
        console.log(`Loaded ${trackedItems.size} tracked items from file.`);
    } catch (error) {
        if (error.code === 'ENOENT') {
            // File doesn't exist, which is fine on first run.
            console.log('tracked-items.json not found. A new one will be created.');
            await saveTrackedItems(); // Create the file with an empty object
        } else {
            console.error('Error loading tracked items:', error);
        }
    }
}

// Function to save the map to the JSON file
async function saveTrackedItems() {
    try {
        const itemsObject = Object.fromEntries(trackedItems);
        await fs.writeFile(TRACKED_ITEMS_PATH, JSON.stringify(itemsObject, null, 2));
    } catch (error) {
        console.error('Error saving tracked items:', error);
    }
}

// Load items when the bot starts
loadTrackedItems();

// --- End of New Functions ---


async function scrapeAmazonProduct(url) {
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
            }
        });

        if (!response.ok) {
            console.error(`Failed to fetch ${url}, status: ${response.status}`);
            return null;
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        const title = $('#productTitle').text().trim();
        const priceText = $('.a-price .a-offscreen').first().text().trim();
        const imageUrl = $('#landingImage').attr('src');

        if (!title || !priceText) {
            return null; // Could not find essential details
        }

        return { title, priceText, imageUrl, url };
    } catch (error) {
        console.error('Error scraping Amazon product:', error);
        return null;
    }
}

export default {
    data: new SlashCommandBuilder()
        .setName('amazonprice')
        .setDescription('Track the price of an Amazon item in a dedicated channel.')
        .addStringOption(option =>
            option.setName('url')
                .setDescription('The full Amazon product URL')
                .setRequired(true)),
    category: 'booster',
    boosterOnly: true,

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const url = interaction.options.getString('url');
        if (!url.includes('amazon.com')) {
            return interaction.editReply('Please provide a valid Amazon.com URL.');
        }

        const product = await scrapeAmazonProduct(url);
        if (!product) {
            return interaction.editReply('Could not scrape product details. The URL might be invalid or the page structure may have changed.');
        }

        // Use product title to create a unique channel name
        const channelName = `price-${product.title.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 50)}`;

        const requiredPermissions = [PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ManageWebhooks];
        if (!interaction.guild.members.me.permissions.has(requiredPermissions)) {
            return interaction.editReply('I need "Manage Channels" and "Manage Webhooks" permissions to do this.');
        }

        const category = await interaction.guild.channels.fetch(PRICE_CHECKER_CATEGORY_ID).catch(() => null);
        if (!category || category.type !== ChannelType.GuildCategory) {
            return interaction.editReply(`The category for price checkers (ID: ${PRICE_CHECKER_CATEGORY_ID}) was not found.`);
        }

        let channel = interaction.guild.channels.cache.find(ch => ch.name === channelName && ch.parentId === category.id);

        if (channel) {
            return interaction.editReply(`This item is already being tracked in #${channel.name}.`);
        }

        try {
            channel = await interaction.guild.channels.create({
                name: channelName,
                type: ChannelType.GuildText,
                parent: category.id,
                topic: `Price tracking for: ${product.url}`,
            });

            const embed = new EmbedBuilder()
                .setTitle(product.title)
                .setURL(product.url)
                .setImage(product.imageUrl)
                .addFields({ name: 'Current Price', value: product.priceText })
                .setColor('#FF9900')
                .setFooter({ text: 'Amazon Price Tracker' })
                .setTimestamp();

            const message = await channel.send({ embeds: [embed] });

            // Save the item to our tracking map AND to the file
            trackedItems.set(channel.id, {
                url: product.url,
                lastPrice: product.priceText,
                messageId: message.id,
                channelId: channel.id,
            });
            await saveTrackedItems(); // This is the crucial save step!

            await interaction.editReply(`Successfully created channel #${channel.name} to track the item.`);

        } catch (error) {
            console.error('Error creating channel or tracking item:', error);
            await interaction.editReply('An error occurred while setting up the tracker.');
        }
    },
};
