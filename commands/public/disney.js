import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import fetch from 'node-fetch';

export default {
    data: new SlashCommandBuilder()
        .setName('disney')
        .setDescription('Get information about a random Disney character'),

    async execute(interaction) {
        await interaction.deferReply();

        const fetchRandomCharacter = async () => {
            const response = await fetch('https://api.disneyapi.dev/character');
            const data = await response.json();
            return data.data[Math.floor(Math.random() * data.data.length)];
        };

        const createCharacterEmbed = (character) => {
            return new EmbedBuilder()
                .setColor('#1E90FF')
                .setTitle(character.name)
                .setDescription(character.films.join(', ') || 'No films listed')
                .addFields(
                    { name: 'TV Shows', value: character.tvShows.join(', ') || 'None', inline: true },
                    { name: 'Video Games', value: character.videoGames.join(', ') || 'None', inline: true },
                    { name: 'Park Attractions', value: character.parkAttractions.join(', ') || 'None', inline: true }
                )
                .setImage(character.imageUrl)
                .setTimestamp()
                .setFooter({ text: 'Powered by Disney API' });
        };

        try {
            const character = await fetchRandomCharacter();
            const embed = createCharacterEmbed(character);

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('new_character')
                        .setLabel('Get Another Character')
                        .setStyle(ButtonStyle.Primary),
                );

            const response = await interaction.editReply({
                embeds: [embed],
                components: [row],
            });

            const collector = response.createMessageComponentCollector({ time: 60000 });

            collector.on('collect', async i => {
                if (i.customId === 'new_character') {
                    await i.deferUpdate();
                    const newCharacter = await fetchRandomCharacter();
                    const newEmbed = createCharacterEmbed(newCharacter);
                    await i.editReply({ embeds: [newEmbed], components: [row] });
                }
            });

            collector.on('end', () => {
                row.components[0].setDisabled(true);
                interaction.editReply({ components: [row] });
            });

        } catch (error) {
            console.error('Error fetching Disney character:', error);
            await interaction.editReply('Sorry, I couldn\'t fetch a Disney character at the moment. Try again later!');
        }
    },
};