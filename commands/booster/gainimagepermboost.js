
import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('gainimagepermboost')
        .setDescription('Enable image uploads for a duration based on how long you have boosted the server.'),
    category: 'booster',
    boosterOnly: true, // Restricts this command to server boosters

    async execute(interaction) {
        // The `boosterOnly` flag in main.js handles the role check, but we also ensure they are an active booster.
        if (!interaction.member.premiumSince) {
            return interaction.reply({
                content: 'You must be actively boosting the server to use this command.',
                ephemeral: true
            });
        }

        // --- Calculate Permission Duration ---
        const boostStartDate = interaction.member.premiumSince;
        const now = new Date();
        const boostDurationMs = now.getTime() - boostStartDate.getTime();
        const boostDurationDays = Math.floor(boostDurationMs / (1000 * 60 * 60 * 24));

        // Logic: Grant a random duration between 5 and 30 minutes.
        const minMinutes = 5;
        const maxMinutes = 30;
        const permissionDurationMinutes = Math.floor(Math.random() * (maxMinutes - minMinutes + 1)) + minMinutes;

        const channel = interaction.channel;

        // Check if the bot has permission to manage channel permissions
        if (!channel.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.ManageChannels)) {
            return interaction.reply({
                content: 'I do not have permission to manage this channel. Please ensure I have the "Manage Channels" permission.',
                ephemeral: true
            });
        }

        try {
            // Allow @everyone to attach files
            await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                AttachFiles: true
            });

            await interaction.reply({
                content: `Thanks to your **${boostDurationDays} days** of boosting, ${interaction.user.username} has enabled image uploads in this channel for **${permissionDurationMinutes} minute(s)**!`,
                ephemeral: false
            });

            // Set a timer to revoke the permission
            setTimeout(async () => {
                try {
                    // Re-fetch the channel to ensure permissions are current
                    const currentChannel = await interaction.guild.channels.fetch(channel.id);
                    await currentChannel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                        AttachFiles: null // Reverts to the default server/category setting
                    });
                    await channel.send('Image upload permissions have been returned to normal.');
                } catch (error) {
                    console.error('Error reverting image permissions:', error);
                    await channel.send('There was an error trying to revert image permissions. A moderator may need to fix it manually.');
                }
            }, permissionDurationMinutes * 60 * 1000); // duration in milliseconds

        } catch (error) {
            console.error('Error setting image permissions:', error);
            await interaction.reply({
                content: 'An error occurred while trying to enable image permissions. Please try again later.',
                ephemeral: true
            });
        }
    }
};
