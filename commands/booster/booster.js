
import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('booster')
        .setDescription('Commands exclusive to server boosters.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('perks')
                .setDescription('A special thank you message for our server boosters!'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('imageperm')
                .setDescription('Temporarily allows everyone to upload images in this channel.')
                .addIntegerOption(option =>
                    option.setName('duration')
                        .setDescription('How many minutes to allow image uploads (default: 5).')
                        .setRequired(false))),
    boosterOnly: true, // This flag restricts the entire command to boosters

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'perks') {
            const embed = new EmbedBuilder()
                .setColor('#f47fff') // Booster pink color
                .setTitle('✨ Thank You for Boosting! ✨')
                .setDescription(`Hey ${interaction.user.username}, thank you for being an amazing server booster! Your support helps the community thrive.`)
                .setTimestamp()
                .setFooter({ text: 'We appreciate you!' });

            await interaction.reply({
                embeds: [embed],
                ephemeral: true
            });

        } else if (subcommand === 'imageperm') {
            const duration = interaction.options.getInteger('duration') || 5; // Default to 5 minutes
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
                    content: `Image uploads have been enabled in this channel for **${duration} minute(s)** by our booster, ${interaction.user.username}!`,
                    ephemeral: false
                });

                // Set a timer to revoke the permission
                setTimeout(async () => {
                    try {
                        await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                            AttachFiles: null // Reverts to the default server/category setting
                        });
                        await channel.send('Image upload permissions have been returned to normal.');
                    } catch (error) {
                        console.error('Error reverting image permissions:', error);
                        await channel.send('There was an error trying to revert image permissions. A moderator may need to fix it manually.');
                    }
                }, duration * 60 * 1000); // duration in milliseconds

            } catch (error) {
                console.error('Error setting image permissions:', error);
                await interaction.reply({
                    content: 'An error occurred while trying to enable image permissions. Please try again later.',
                    ephemeral: true
                });
            }
        }
    }
};
