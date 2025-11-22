
import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import * as cheerio from 'cheerio';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// A function to scrape a random card from the Fandom wiki.
const fetchRandomCard = async () => {
    let attempts = 0;
    const maxAttempts = 10; // Prevent infinite loops

    while (attempts < maxAttempts) {
        const response = await fetch('https://starwarscardtrader.fandom.com/wiki/Special:Random');
        if (!response.ok) {
            throw new Error(`Failed to fetch random page with status: ${response.status}`);
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // Check if it's a card page by looking for the infobox
        const infobox = $('aside.portable-infobox');
        if (infobox.length === 0) {
            attempts++;
            continue; // Not a card page, try again
        }

        const name = infobox.find('h2.pi-title').text().trim();
        const imageUrl = infobox.find('figure.pi-image img').attr('src');

        // Helper to get data from infobox rows
        const getInfoboxData = (label) => {
            const labelToFind = label.toLowerCase();
            let value = '';
            infobox.find('.pi-data-label').each((i, el) => {
                if ($(el).text().trim().toLowerCase() === labelToFind) {
                    value = $(el).next('.pi-data-value').text().trim();
                    return false; // Stop iterating once found
                }
            });
            return value;
        };

        const rarity = getInfoboxData('Rarity');
        const series = getInfoboxData('Series'); // Changed from 'Set/Series'
        const count = getInfoboxData('Card Count');
        const year = getInfoboxData('Year');

        // Ensure we have at least a name and an image to consider it valid
        if (name && imageUrl) {
            return {
                name,
                series: series || 'Unknown Series',
                rarity: rarity || 'Unknown Rarity',
                year: year || 'Unknown Year',
                count: count || 'N/A',
                image_url: imageUrl,
            };
        }
        
        attempts++;
    }

    throw new Error('Failed to find a valid card page after multiple attempts.');
};

const createCardEmbed = (card) => {
    const embed = new EmbedBuilder()
        .setColor('#FFE81F') // A Star Wars-y yellow
        .setTitle(card.name)
        .setImage(card.image_url)
        .setTimestamp()
        .setFooter({ text: 'Powered by the Fandom Wiki' });

    if (card.series && card.series !== 'Unknown Series') {
        embed.addFields({ name: 'Series', value: card.series, inline: true });
    }
    if (card.year && card.year !== 'Unknown Year') {
        embed.addFields({ name: 'Year', value: card.year, inline: true });
    }
    if (card.count && card.count !== 'N/A') {
        embed.addFields({ name: 'Card Count', value: card.count, inline: true });
    }

    return embed;
};

export default {
    data: new SlashCommandBuilder()
        .setName('swcard')
        .setDescription('Get a random card from Star Wars: Card Trader.'),
    category: 'public',

    async execute(interaction) {
        await interaction.deferReply();

        try {
            const card = await fetchRandomCard();
            const embed = createCardEmbed(card);

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('new_swcard')
                        .setLabel('Get Another Card')
                        .setStyle(ButtonStyle.Primary),
                );

            const response = await interaction.editReply({
                embeds: [embed],
                components: [row],
            });

            const collector = response.createMessageComponentCollector({ time: 60000 }); // 60 seconds

            collector.on('collect', async i => {
                if (i.customId === 'new_swcard') {
                    await i.deferUpdate();
                    try {
                        const newCard = await fetchRandomCard();
                        const newEmbed = createCardEmbed(newCard);
                        await i.editReply({ embeds: [newEmbed], components: [row] });
                    } catch (error) {
                        console.error('Error fetching new Star Wars card:', error);
                        await i.followUp({ content: "Sorry, I couldn't fetch a new card. Please try again.", ephemeral: true });
                    }
                }
            });

            collector.on('end', () => {
                row.components[0].setDisabled(true);
                interaction.editReply({ components: [row] });
            });

        } catch (error) {
            console.error('Error in swcard command:', error);
            await interaction.editReply("Sorry, I couldn't fetch a Star Wars card at the moment. The card database might be unavailable.");
        }
    }
};
