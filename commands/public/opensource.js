
import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('opensource')
        .setDescription("Get a link to the bot's open-source GitHub repository."),
    category: 'public',

    async execute(interaction) {
        await interaction.deferReply();

        try {
            const repoUrl = 'https://github.com/scratchgamingone/Custom-Bot';

            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('This Bot is Open Source!')
                .setURL(repoUrl)
                .setDescription(
                    "I'm an open-source project! This means anyone can view my code, suggest improvements, or even contribute to my development. Your contributions help make me better for everyone."
                )
                .addFields(
                    { name: 'How to Contribute?', value: 'Feel free to fork the repository, create a new branch for your feature or bug fix, and submit a pull request. All contributions are welcome!' }
                )
                .setThumbnail(interaction.client.user.displayAvatarURL())
                .setTimestamp()
                .setFooter({ text: 'Click the button below to visit the repository!' });

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel('View on GitHub')
                        .setStyle(ButtonStyle.Link)
                        .setURL(repoUrl)
                );

            await interaction.editReply({
                embeds: [embed],
                components: [row],
            });

        } catch (error) {
            console.error('Error in opensource command:', error);
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ content: 'Oops! Something went wrong while fetching the repository information.', embeds: [], components: [] });
            } else {
                await interaction.reply({ content: 'Oops! Something went wrong while fetching the repository information.', ephemeral: true });
            }
        }
    }
};
