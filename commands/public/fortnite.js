import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import fetch from 'node-fetch';

export default {
    data: new SlashCommandBuilder()
        .setName('fortniteitem')
        .setDescription('Get a random Fortnite item'),

    async execute(interaction) {
        await interaction.deferReply();

        const fetchRandomItem = async () => {
            const response = await fetch('https://fortnite-api.com/v2/cosmetics/br');
            if (!response.ok) {
                throw new Error(`API responded with status: ${response.status}`);
            }
            const data = await response.json();
            console.log('API Response:', JSON.stringify(data, null, 2));  // Log the full response
            if (!data.data || data.data.length === 0) {
                throw new Error('No items found in the API response');
            }
            return data.data[Math.floor(Math.random() * data.data.length)];
        };

        const createItemEmbed = (item) => {
            return new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle(item.name || 'Unknown Item')
                .setDescription(item.description || 'No description available')
                .addFields(
                    { name: 'Rarity', value: item.rarity?.displayValue || 'Unknown', inline: true },
                    { name: 'Type', value: item.type?.displayValue || 'Unknown', inline: true },
                    { name: 'Introduction', value: item.introduction?.text || 'Unknown', inline: true }
                )
                .setImage(item.images?.icon || null)
                .setTimestamp()
                .setFooter({ text: `Fortnite Item ID: ${item.id || 'Unknown'}` });
        };

        try {
            const item = await fetchRandomItem();
            const embed = createItemEmbed(item);

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('new_item')
                        .setLabel('Get Another Item')
                        .setStyle(ButtonStyle.Primary),
                );

            const response = await interaction.editReply({
                embeds: [embed],
                components: [row],
            });

            const collector = response.createMessageComponentCollector({ time: 60000 });

            collector.on('collect', async i => {
                if (i.customId === 'new_item') {
                    await i.deferUpdate();
                    try {
                        const newItem = await fetchRandomItem();
                        const newEmbed = createItemEmbed(newItem);
                        await i.editReply({ embeds: [newEmbed], components: [row] });
                    } catch (error) {
                        console.error('Error fetching new Fortnite item:', error);
                        await i.editReply({ content: 'Sorry, I couldn\'t fetch a new Fortnite item. Please try again.', components: [] });
                    }
                }
            });

            collector.on('end', () => {
                row.components[0].setDisabled(true);
                interaction.editReply({ components: [row] });
            });

        } catch (error) {
            console.error('Error in Fortnite item command:', error);
            await interaction.editReply('Sorry, I couldn\'t fetch a Fortnite item at the moment. Try again later!');
        }
    }
};