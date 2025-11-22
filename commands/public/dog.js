
import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('dog')
        .setDescription('Get a random dog picture'),
    category: 'public',

    async execute(interaction) {
        await interaction.deferReply();

        const fetchDogImage = async () => {
            const response = await fetch('https://dog.ceo/api/breeds/image/random');
            if (!response.ok) {
                throw new Error(`API responded with status: ${response.status}`);
            }
            const data = await response.json();
            if (data.status !== 'success' || !data.message) {
                throw new Error('Invalid API response');
            }
            return data.message;
        };

        const createDogEmbed = (imageUrl) => {
            return new EmbedBuilder()
                .setColor('#FFC0CB')
                .setTitle('Here's a random dog!')
                .setImage(imageUrl)
                .setTimestamp()
                .setFooter({ text: 'Powered by dog.ceo API' });
        };

        try {
            const imageUrl = await fetchDogImage();
            const embed = createDogEmbed(imageUrl);

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('new_dog')
                        .setLabel('Get Another Dog')
                        .setStyle(ButtonStyle.Success),
                );

            const response = await interaction.editReply({
                embeds: [embed],
                components: [row],
            });

            const collector = response.createMessageComponentCollector({ time: 60000 });

            collector.on('collect', async i => {
                if (i.customId === 'new_dog') {
                    await i.deferUpdate();
                    try {
                        const newImageUrl = await fetchDogImage();
                        const newEmbed = createDogEmbed(newImageUrl);
                        await i.editReply({ embeds: [newEmbed], components: [row] });
                    } catch (error) {
                        console.error('Error fetching new dog image:', error);
                        await i.followUp({ content: "Sorry, I couldn't fetch a new dog picture. Please try again.", ephemeral: true });
                    }
                }
            });

            collector.on('end', () => {
                row.components[0].setDisabled(true);
                interaction.editReply({ components: [row] });
            });

        } catch (error) {
            console.error('Error in dog command:', error);
            await interaction.editReply("Sorry, I couldn't fetch a dog picture at the moment. Try again later!");
        }
    }
};
