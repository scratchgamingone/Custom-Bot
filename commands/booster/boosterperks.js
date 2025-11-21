
import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('boosterperks')
        .setDescription('A special command to thank our server boosters!'),
    category: 'booster',
    boosterOnly: true, // This flag restricts the command to boosters

    async execute(interaction) {
        // Filter all client commands to find only the ones in the 'booster' category
        const boosterCommands = interaction.client.commands.filter(cmd => cmd.category === 'booster');
        const boosterCommandCount = boosterCommands.size;

        const embed = new EmbedBuilder()
            .setColor('#f47fff') // Booster pink color
            .setTitle('✨ Thank You for Boosting! ✨')
            .setDescription(`Hey ${interaction.user.username}, thank you for being an amazing server booster! Your support helps the community thrive.\n\nYou currently have access to **${boosterCommandCount}** booster-exclusive command(s).`)
            .setTimestamp()
            .setFooter({ text: 'We appreciate you!' });

        await interaction.reply({
            embeds: [embed],
            ephemeral: true // The reply will only be visible to the booster
        });
    }
};
