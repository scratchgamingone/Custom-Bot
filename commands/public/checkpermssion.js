import { SlashCommandBuilder, PermissionsBitField, EmbedBuilder, ChannelType } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('checkpermission')
    .setDescription('Check your permissions in a channel')
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('The channel to check permissions in (default: current channel)')
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildVoice, ChannelType.GuildCategory)
        .setRequired(false)),

  async execute(interaction) {
    const member = interaction.member;
    const targetChannel = interaction.options.getChannel('channel') || interaction.channel;
    const permissions = member.permissionsIn(targetChannel);

    const permissionNames = Object.keys(PermissionsBitField.Flags);
    const userPermissions = permissionNames.filter(perm => permissions.has(PermissionsBitField.Flags[perm]));

    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle(`Permissions for ${member.user.tag}`)
      .setDescription(`Here are your permissions in ${targetChannel.name}:`)
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .setTimestamp();

    // Split permissions into fields of 10 each to avoid hitting the field limit
    for (let i = 0; i < userPermissions.length; i += 10) {
      const fieldPermissions = userPermissions.slice(i, i + 10);
      embed.addFields({
        name: `Permissions ${i / 10 + 1}`,
        value: fieldPermissions.map(perm => `✅ ${perm}`).join('\n') || 'None',
        inline: true
      });
    }

    // Add a field for permissions the user doesn't have
    const missingPermissions = permissionNames.filter(perm => !permissions.has(PermissionsBitField.Flags[perm]));
    embed.addFields({
      name: 'Permissions You Don\'t Have',
      value: missingPermissions.slice(0, 10).map(perm => `❌ ${perm}`).join('\n') + 
             (missingPermissions.length > 10 ? '\n...and more' : '') || 'None',
      inline: false
    });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};