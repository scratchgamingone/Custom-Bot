import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import fetch from 'node-fetch';

export default {
    data: new SlashCommandBuilder()
        .setName('randomcomic')
        .setDescription('Get a random XKCD comic'),

    async execute(interaction) {
        await interaction.deferReply();

        const fetchRandomComic = async () => {
            // First, fetch the latest comic number
            const latestResponse = await fetch('https://xkcd.com/info.0.json');
            const latestData = await latestResponse.json();
            const latestNum = latestData.num;

            // Generate a random comic number
            const randomNum = Math.floor(Math.random() * latestNum) + 1;

            // Fetch the random comic
            const response = await fetch(`https://xkcd.com/${randomNum}/info.0.json`);
            return response.json();
        };

        const createComicEmbed = (comic) => {
            return new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle(comic.title)
                .setURL(`https://xkcd.com/${comic.num}`)
                .setDescription(comic.alt)
                .setImage(comic.img)
                .setTimestamp()
                .setFooter({ text: `XKCD #${comic.num}` });
        };

        try {
            const comic = await fetchRandomComic();
            const embed = createComicEmbed(comic);

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('new_comic')
                        .setLabel('Get Another Comic')
                        .setStyle(ButtonStyle.Primary),
                );

            const response = await interaction.editReply({
                embeds: [embed],
                components: [row],
            });

            const collector = response.createMessageComponentCollector({ time: 60000 });

            collector.on('collect', async i => {
                if (i.customId === 'new_comic') {
                    await i.deferUpdate();
                    const newComic = await fetchRandomComic();
                    const newEmbed = createComicEmbed(newComic);
                    await i.editReply({ embeds: [newEmbed], components: [row] });
                }
            });

            collector.on('end', () => {
                row.components[0].setDisabled(true);
                interaction.editReply({ components: [row] });
            });

        } catch (error) {
            console.error('Error fetching comic:', error);
            await interaction.editReply('Sorry, I couldn\'t fetch a comic at the moment. Try again later!');
        }
    }
};