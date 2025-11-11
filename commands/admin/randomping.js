import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  adminOnly: true,
  data: new SlashCommandBuilder()
    .setName('randomping')
    .setDescription('Ping a random member in the server (Admin only)')
    .addStringOption(option =>
      option.setName('message')
        .setDescription('The message to send with the ping')
        .setRequired(true)),

  async execute(interaction) {
    // Check if the user has admin permissions
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: 'You need to be an administrator to use this command!', ephemeral: true });
    }

    try {
      await interaction.deferReply();

      // Fetch all members in the guild
      await interaction.guild.members.fetch();

      // Filter out bots and get a random member
      const members = interaction.guild.members.cache.filter(member => !member.user.bot);
      const randomMember = members.random();

      if (!randomMember) {
        return interaction.editReply('No non-bot members found in the server.');
      }

      const message = interaction.options.getString('message');

      // Send the message with the random ping
      await interaction.editReply(`${randomMember} ${message}`);

    } catch (error) {
      console.error('Error in randomping command:', error);
      await interaction.editReply('An error occurred while executing the command.');
    }
  },
};