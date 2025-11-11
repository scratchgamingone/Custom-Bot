import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';

export default {
  ownerOnly: true,
  data: new SlashCommandBuilder()
    .setName('createprivatecategory')
    .setDescription('Create a private category with text and voice channels for a member or bot')
    .addUserOption(option =>
      option.setName('target')
        .setDescription('The member or bot to create the private category for')
        .setRequired(true)),

  async execute(interaction) {
    const target = interaction.options.getMember('target');

    if (!target) {
      return interaction.reply({ content: "Unable to find the specified member or bot.", ephemeral: true });
    }

    try {
      // Check if the target already has a private category
      const existingCategory = interaction.guild.channels.cache.find(
        channel => channel.type === ChannelType.GuildCategory &&
                   channel.name === `${target.user.username}'s Area` &&
                   channel.permissionsFor(target).has(PermissionFlagsBits.ViewChannel)
      );

      if (existingCategory) {
        return interaction.reply({ 
          content: `${target.user.username} already has a private category: ${existingCategory}. You can't create another one to avoid duplicates.`,
          ephemeral: true 
        });
      }

      const fullPermissions = [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.ManageRoles,
        PermissionFlagsBits.ManageWebhooks,
        PermissionFlagsBits.CreateInstantInvite,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.EmbedLinks,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.AddReactions,
        PermissionFlagsBits.UseExternalEmojis,
        PermissionFlagsBits.MentionEveryone,
        PermissionFlagsBits.ManageMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.SendTTSMessages,
        PermissionFlagsBits.Connect,
        PermissionFlagsBits.Speak,
        PermissionFlagsBits.Stream,
        PermissionFlagsBits.MuteMembers,
        PermissionFlagsBits.DeafenMembers,
        PermissionFlagsBits.MoveMembers,
        PermissionFlagsBits.UseVAD,
        PermissionFlagsBits.PrioritySpeaker,
      ];

      const category = await interaction.guild.channels.create({
        name: `${target.user.username}'s Area`,
        type: ChannelType.GuildCategory,
        permissionOverwrites: [
          {
            id: interaction.guild.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: target.id,
            allow: fullPermissions,
          },
        ],
      });

      const textChannel = await interaction.guild.channels.create({
        name: `${target.user.username}-chat`,
        type: ChannelType.GuildText,
        parent: category.id,
        permissionOverwrites: [
          {
            id: interaction.guild.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: target.id,
            allow: fullPermissions,
          },
        ],
      });

      const voiceChannel = await interaction.guild.channels.create({
        name: `${target.user.username}'s Voice`,
        type: ChannelType.GuildVoice,
        parent: category.id,
        permissionOverwrites: [
          {
            id: interaction.guild.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: target.id,
            allow: fullPermissions,
          },
        ],
      });

      await interaction.reply({ 
        content: `Private channels have been created for ${target.user.username}! Category: ${category}, Text: ${textChannel}, Voice: ${voiceChannel}. They have full permissions in these channels.`,
        ephemeral: true 
      });
    } catch (error) {
      console.error('Error creating private channels:', error);
      await interaction.reply({ content: 'An error occurred while creating the private channels. Please try again later.', ephemeral: true });
    }
  },
};