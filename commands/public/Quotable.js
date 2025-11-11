import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import fetch from 'node-fetch';

export default {
    data: new SlashCommandBuilder()
        .setName('randomquote')
        .setDescription('Get a random quote'),

    async execute(interaction) {
        await interaction.deferReply();

        const fetchRandomQuote = async () => {
            const response = await fetch('https://zenquotes.io/api/random');
            const data = await response.json();
            return data[0]; // The API returns an array with a single quote object
        };

        const createQuoteEmbed = (quote) => {
            return new EmbedBuilder()
                .setColor('#4A90E2')
                .setTitle('Random Inspirational Quote')
                .setDescription(`"${quote.q}"`)
                .addFields(
                    { name: 'Author', value: quote.a, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: 'Powered by ZenQuotes API' });
        };

        try {
            const quote = await fetchRandomQuote();
            const embed = createQuoteEmbed(quote);

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('new_quote')
                        .setLabel('Get Another Quote')
                        .setStyle(ButtonStyle.Primary),
                );

            const response = await interaction.editReply({
                embeds: [embed],
                components: [row],
            });

            const collector = response.createMessageComponentCollector({ time: 60000 });

            collector.on('collect', async i => {
                if (i.customId === 'new_quote') {
                    await i.deferUpdate();
                    const newQuote = await fetchRandomQuote();
                    const newEmbed = createQuoteEmbed(newQuote);
                    await i.editReply({ embeds: [newEmbed], components: [row] });
                }
            });

            collector.on('end', () => {
                row.components[0].setDisabled(true);
                interaction.editReply({ components: [row] });
            });

        } catch (error) {
            console.error('Error fetching random quote:', error);
            await interaction.editReply('Sorry, I couldn\'t fetch a quote at the moment. Try again later!');
        }
    },
};