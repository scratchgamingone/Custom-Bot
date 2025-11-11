import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('privateboosterchannel')
    .setDescription('Create a private category with text and voice channels for boosters'),
  boosterOnly: true,

  async execute(interaction) {
    const member = interaction.member;
    const boosterRoleId = process.env.BOOSTER_ROLE_ID;

    if (!member.roles.cache.has(boosterRoleId)) {
      return interaction.reply({ content: "You need to be a server booster to use this command!", ephemeral: true });
    }

    try {
      // Check if the user already has a private category
      const existingCategory = interaction.guild.channels.cache.find(
        channel => channel.type === ChannelType.GuildCategory &&
                   channel.name === `${member.user.username}'s Area` &&
                   channel.permissionsFor(member).has(PermissionFlagsBits.ManageChannels)
      );

      if (existingCategory) {
        return interaction.reply({ 
          content: `You already have a private category: ${existingCategory}. You can't create another one to avoid duplicates.`,
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
        name: `${member.user.username}'s Area`,
        type: ChannelType.GuildCategory,
        permissionOverwrites: [
          {
            id: interaction.guild.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: member.id,
            allow: fullPermissions,
          },
        ],
      });

      const textChannel = await interaction.guild.channels.create({
        name: `${member.user.username}-chat`,
        type: ChannelType.GuildText,
        parent: category.id,
        permissionOverwrites: [
          {
            id: interaction.guild.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: member.id,
            allow: fullPermissions,
          },
        ],
      });

      const voiceChannel = await interaction.guild.channels.create({
        name: `${member.user.username}'s Voice`,
        type: ChannelType.GuildVoice,
        parent: category.id,
        permissionOverwrites: [
          {
            id: interaction.guild.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: member.id,
            allow: fullPermissions,
          },
        ],
      });

      await interaction.reply({ 
        content: `Your private channels have been created! Check out ${textChannel} and ${voiceChannel}. You have full permissions in these channels, including the ability to invite others.`,
        ephemeral: true 
      });
    } catch (error) {
      console.error('Error creating private channels:', error);
      await interaction.reply({ content: 'An error occurred while creating your private channels. Please try again later.', ephemeral: true });
    }
  },
};
