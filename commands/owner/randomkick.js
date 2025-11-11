import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  ownerOnly: true,
  data: new SlashCommandBuilder()
    .setName('randomkick')
    .setDescription('Kick a random member from the server and send them an invite (Owner only)'),

  async execute(interaction) {
    if (interaction.user.id !== process.env.OWNER_ID) {
      return interaction.reply({ content: 'This command is only available to the bot owner.', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const guild = interaction.guild;
      await guild.members.fetch();

      const kickableMembers = guild.members.cache.filter(member => 
        !member.user.bot && 
        member.kickable && 
        member.id !== process.env.OWNER_ID
      );

      if (kickableMembers.size === 0) {
        return interaction.editReply('There are no kickable members in this server.');
      }

      const randomMember = kickableMembers.random();

      // Create an invite link
      let invite;
      try {
        const botMember = guild.members.cache.get(interaction.client.user.id);
        const channel = guild.channels.cache.find(channel => 
          channel.type === 0 && // Text channel
          channel.permissionsFor(botMember).has(PermissionFlagsBits.CreateInstantInvite)
        );
        if (channel) {
          invite = await channel.createInvite({
            maxAge: 86400, // 24 hours
            maxUses: 1 // One-time use
          });
        } else {
          console.error('No suitable channel found for creating an invite');
        }
      } catch (inviteError) {
        console.error('Failed to create invite:', inviteError);
      }

      // Send DM with invite link
      if (invite) {
        try {
          await randomMember.send(`You've been randomly kicked from ${guild.name}. Here's an invite link if you'd like to rejoin: ${invite.url}`);
        } catch (dmError) {
          console.error('Failed to send DM to the kicked member:', dmError);
        }
      }

      // Kick the member
      await randomMember.kick('Randomly selected for kick by owner');

      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('Random Member Kicked')
        .setDescription(`${randomMember.user.tag} has been kicked from the server.`)
        .addFields(
          { name: 'Member ID', value: randomMember.id },
          { name: 'Kicked by', value: interaction.user.tag },
          { name: 'Reason', value: 'Randomly selected for kick by owner' }
        )
        .setTimestamp()
        .setFooter({ text: 'Random Kick Command' });

      if (invite) {
        embed.addFields({ name: 'Invite Link', value: invite.url });
      } else {
        embed.addFields({ name: 'Invite Link', value: 'Failed to create invite' });
      }

      await interaction.editReply({ content: `${randomMember.user.tag} has been kicked from the server.${invite ? ' An invite link was sent to their DMs.' : ''}`, ephemeral: true });

      // Log the kick in the specified channel
      const logChannelId = process.env.RANDOM_KICK_LOG;
      if (logChannelId) {
        const logChannel = await interaction.client.channels.fetch(logChannelId);
        if (logChannel && logChannel.isTextBased()) {
          await logChannel.send({ embeds: [embed] });
        } else {
          console.error('Invalid channel for random kick log');
        }
      } else {
        console.error('RANDOM_KICK_LOG channel ID not set in .env file');
      }

    } catch (error) {
      console.error('Error in randomkick command:', error);
      await interaction.editReply('An error occurred while executing the command.');
    }
  },
};