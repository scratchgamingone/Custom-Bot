import { SlashCommandBuilder } from 'discord.js';

export default {
  boosterOnly: true,
  data: new SlashCommandBuilder()
    .setName('boostercheck')
    .setDescription('Check if you are a booster'),

  async execute(interaction) {
    await interaction.reply({
      content: '✅ You are a booster! Thank you for supporting the server.',
      ephemeral: true
    });
  }
};
