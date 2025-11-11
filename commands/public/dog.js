import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import fetch from 'node-fetch';

export default {
    data: new SlashCommandBuilder()
        .setName('randomdog')
        .setDescription('Get a random dog image'),

    async execute(interaction) {
        await interaction.deferReply();

        const fetchDogImage = async () => {
            const response = await fetch('https://api.thedogapi.com/v1/images/search');
            const data = await response.json();
            return data[0];
        };

        const createDogEmbed = (dogData) => {
            return new EmbedBuilder()
                .setColor('#00BFFF')
                .setTitle('Random Dog Image')
                .setImage(dogData.url)
                .setTimestamp()
                .setFooter({ text: 'Powered by The Dog API' });
        };

        try {
            const dogData = await fetchDogImage();
            const embed = createDogEmbed(dogData);

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('new_dog')
                        .setLabel('Get Another Dog')
                        .setStyle(ButtonStyle.Primary),
                );

            const response = await interaction.editReply({
                embeds: [embed],
                components: [row],
            });

            const collector = response.createMessageComponentCollector({ time: 60000 });

            collector.on('collect', async i => {
                if (i.customId === 'new_dog') {
                    await i.deferUpdate();
                    const newDogData = await fetchDogImage();
                    const newEmbed = createDogEmbed(newDogData);
                    await i.editReply({ embeds: [newEmbed], components: [row] });
                }
            });

            collector.on('end', () => {
                row.components[0].setDisabled(true);
                interaction.editReply({ components: [row] });
            });

        } catch (error) {
            console.error('Error fetching dog image:', error);
            await interaction.editReply('Sorry, I couldn\'t fetch a dog image at the moment. Try again later!');
        }
    },
};