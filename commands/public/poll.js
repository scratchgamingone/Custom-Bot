import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const EMOJI_NUMBERS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

export default {
  data: new SlashCommandBuilder()
    .setName('poll')
    .setDescription('Create a poll with up to 10 options')
    .addStringOption(option =>
      option.setName('question')
        .setDescription('The question for the poll')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('options')
        .setDescription('Poll options separated by commas (e.g., "Option 1, Option 2, Option 3")')
        .setRequired(true)),

  async execute(interaction) {
    const question = interaction.options.getString('question');
    const optionsString = interaction.options.getString('options');
    const options = optionsString.split(',').map(option => option.trim()).filter(option => option !== '');

    if (options.length < 2 || options.length > 10) {
      return interaction.reply({ content: 'Please provide between 2 and 10 options for the poll.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('📊 ' + question)
      .setDescription(options.map((option, index) => `${EMOJI_NUMBERS[index]} ${option}`).join('\n'))
      .setFooter({ text: `Poll created by ${interaction.user.tag}` })
      .setTimestamp();

    const pollMessage = await interaction.reply({ embeds: [embed], fetchReply: true });

    for (let i = 0; i < options.length; i++) {
      await pollMessage.react(EMOJI_NUMBERS[i]);
    }
  },
};