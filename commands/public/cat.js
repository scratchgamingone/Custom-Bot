import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import fetch from 'node-fetch';

export default {
    data: new SlashCommandBuilder()
        .setName('catfact')
        .setDescription('Get a random cat fact'),

    async execute(interaction) {
        await interaction.deferReply();

        const fetchCatFact = async () => {
            const response = await fetch('https://catfact.ninja/fact');
            return response.json();
        };

        const createCatFactEmbed = (fact) => {
            return new EmbedBuilder()
                .setColor('#FFA500')
                .setTitle('Random Cat Fact')
                .setDescription(fact.fact)
                .addFields(
                    { name: 'Length', value: fact.length.toString(), inline: true }
                )
                .setTimestamp()
                .setFooter({ text: 'Powered by Cat Facts API' });
        };

        try {
            const catFact = await fetchCatFact();
            const embed = createCatFactEmbed(catFact);

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('new_catfact')
                        .setLabel('Get Another Cat Fact')
                        .setStyle(ButtonStyle.Primary),
                );

            const response = await interaction.editReply({
                embeds: [embed],
                components: [row],
            });

            const collector = response.createMessageComponentCollector({ time: 60000 });

            collector.on('collect', async i => {
                if (i.customId === 'new_catfact') {
                    await i.deferUpdate();
                    const newCatFact = await fetchCatFact();
                    const newEmbed = createCatFactEmbed(newCatFact);
                    await i.editReply({ embeds: [newEmbed], components: [row] });
                }
            });

            collector.on('end', () => {
                row.components[0].setDisabled(true);
                interaction.editReply({ components: [row] });
            });

        } catch (error) {
            console.error('Error fetching cat fact:', error);
            await interaction.editReply('Sorry, I couldn\'t fetch a cat fact at the moment. Try again later!');
        }
    },
};