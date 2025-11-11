import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const GIANT_BOMB_API_KEY = process.env.GIANT_BOMB_API_KEY;

export default {
    data: new SlashCommandBuilder()
        .setName('randomgame')
        .setDescription('Get information about a random video game'),

    async execute(interaction) {
        await interaction.deferReply();

        const fetchRandomGame = async () => {
            const response = await fetch(`https://www.giantbomb.com/api/games/?api_key=${GIANT_BOMB_API_KEY}&format=json&limit=1&offset=${Math.floor(Math.random() * 1000)}&field_list=name,deck,image,original_release_date,platforms`);
            const data = await response.json();
            return data.results[0];
        };

        const createGameEmbed = (game) => {
            return new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle(game.name)
                .setDescription(game.deck || 'No description available.')
                .setThumbnail(game.image?.small_url || '')
                .addFields(
                    { name: 'Release Date', value: game.original_release_date || 'Unknown', inline: true },
                    { name: 'Platforms', value: game.platforms?.map(p => p.name).join(', ') || 'Unknown', inline: true }
                )
                .setTimestamp()
                .setFooter({ text: 'Powered by Giant Bomb API' });
        };

        try {
            const game = await fetchRandomGame();
            const embed = createGameEmbed(game);

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('new_game')
                        .setLabel('Get Another Game')
                        .setStyle(ButtonStyle.Primary),
                );

            const response = await interaction.editReply({
                embeds: [embed],
                components: [row],
            });

            const collector = response.createMessageComponentCollector({ time: 60000 });

            collector.on('collect', async i => {
                if (i.customId === 'new_game') {
                    await i.deferUpdate();
                    const newGame = await fetchRandomGame();
                    const newEmbed = createGameEmbed(newGame);
                    await i.editReply({ embeds: [newEmbed], components: [row] });
                }
            });

            collector.on('end', () => {
                row.components[0].setDisabled(true);
                interaction.editReply({ components: [row] });
            });

        } catch (error) {
            console.error('Error fetching random game:', error);
            await interaction.editReply('Sorry, I couldn\'t fetch a random game at the moment. Try again later!');
        }
    }
};