import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import fetch from 'node-fetch';

export default {
    data: new SlashCommandBuilder()
        .setName('nasaapod')
        .setDescription('Get a random NASA Astronomy Picture of the Day'),

    async execute(interaction) {
        await interaction.deferReply();

        const NASA_API_KEY = 'DEMO_KEY'; // Replace with your NASA API key for more requests
        const BASE_URL = 'https://api.nasa.gov/planetary/apod';

        const fetchRandomAPOD = async () => {
            const randomDate = getRandomDate(new Date('1995-06-16'), new Date());
            const url = `${BASE_URL}?api_key=${NASA_API_KEY}&date=${randomDate}`;
            const response = await fetch(url);
            return response.json();
        };

        const getRandomDate = (start, end) => {
            const randomDate = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
            return randomDate.toISOString().split('T')[0];
        };

        const createAPODEmbed = (apodData) => {
            return new EmbedBuilder()
                .setColor('#0B3D91') // NASA Blue
                .setTitle(apodData.title)
                .setURL('https://apod.nasa.gov/apod/astropix.html')
                .setDescription(apodData.explanation)
                .setImage(apodData.url)
                .addFields(
                    { name: 'Date', value: apodData.date, inline: true },
                    { name: 'Copyright', value: apodData.copyright || 'Public Domain', inline: true }
                )
                .setTimestamp()
                .setFooter({ text: 'NASA Astronomy Picture of the Day' });
        };

        try {
            const apodData = await fetchRandomAPOD();
            const embed = createAPODEmbed(apodData);

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('new_apod')
                        .setLabel('Get Another APOD')
                        .setStyle(ButtonStyle.Primary),
                );

            const response = await interaction.editReply({
                embeds: [embed],
                components: [row],
            });

            const collector = response.createMessageComponentCollector({ time: 60000 });

            collector.on('collect', async i => {
                if (i.customId === 'new_apod') {
                    await i.deferUpdate();
                    const newAPODData = await fetchRandomAPOD();
                    const newEmbed = createAPODEmbed(newAPODData);
                    await i.editReply({ embeds: [newEmbed], components: [row] });
                }
            });

            collector.on('end', () => {
                row.components[0].setDisabled(true);
                interaction.editReply({ components: [row] });
            });

        } catch (error) {
            console.error('Error fetching NASA APOD:', error);
            await interaction.editReply('Sorry, I couldn\'t fetch a NASA APOD at the moment. Try again later!');
        }
    },
};