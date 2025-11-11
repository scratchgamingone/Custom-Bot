import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  adminOnly: true,
  data: new SlashCommandBuilder()
    .setName('resetnick')
    .setDescription('Reset the nickname of a user to their original username')
    .addUserOption(option =>
      option.setName('target')
        .setDescription('The user whose nickname to reset')
        .setRequired(true)),

  async execute(interaction) {
    const target = interaction.options.getUser('target');

    if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageNicknames)) {
      return interaction.reply({ content: "I don't have permission to change nicknames.", ephemeral: true });
    }

    try {
      const member = await interaction.guild.members.fetch(target.id);
      
      // Check if the target is the server owner
      if (member.id === interaction.guild.ownerId) {
        return interaction.reply({ content: "I can't change the nickname of the server owner.", ephemeral: true });
      }

      // Check if the bot can manage this user's nickname
      if (!member.manageable) {
        return interaction.reply({ content: "I can't manage this user's nickname due to role hierarchy.", ephemeral: true });
      }

      // Reset the nickname to null, which will remove the nickname and show the original username
      await member.setNickname(null);
      await interaction.reply({ content: `Successfully reset ${target.username}'s nickname to their original username.`, ephemeral: true });
    } catch (error) {
      console.error('Error resetting nickname:', error);
      if (error.code === 50013) {
        await interaction.reply({ content: "I don't have permission to reset this user's nickname. They might have higher permissions than me.", ephemeral: true });
      } else {
        await interaction.reply({ content: `Failed to reset nickname. Error: ${error.message}`, ephemeral: true });
      }
    }
  },
};