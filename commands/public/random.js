import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('random')
    .setDescription('Generate a random number')
    .addIntegerOption(option =>
      option.setName('min')
        .setDescription('Minimum value (optional, default: 0)')
        .setRequired(false)
    )
    .addIntegerOption(option =>
      option.setName('max')
        .setDescription('Maximum value (optional, default: 1000)')
        .setRequired(false)
    ),

  async execute(interaction) {
    try {
      await interaction.deferReply();

      const min = interaction.options.getInteger('min') ?? 0;
      const max = interaction.options.getInteger('max') ?? 1000;

      if (min >= max) {
        return interaction.editReply({
          content: 'Error: Minimum value must be less than maximum value.',
          ephemeral: true
        });
      }

      const generateRandomNumber = () => Math.floor(Math.random() * (max - min + 1)) + min;
      const isEven = (num) => num % 2 === 0;

      const generateEmbed = (number) => {
        const evenOdd = isEven(number) ? 'even' : 'odd';
        return new EmbedBuilder()
          .setColor('#00FF00')
          .setTitle('Random Number Generator')
          .addFields(
            { name: 'Minimum', value: min.toString(), inline: true },
            { name: 'Maximum', value: max.toString(), inline: true },
            { name: 'Result', value: `${number} (${evenOdd} number)`, inline: false }
          )
          .setTimestamp()
          .setFooter({ text: 'Random Number Generator' });
      };

      const initialNumber = generateRandomNumber();
      const embed = generateEmbed(initialNumber);

      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('generate_new')
            .setLabel('Generate New Number')
            .setStyle(ButtonStyle.Primary)
        );

      await interaction.editReply({
        embeds: [embed],
        components: [row],
      });

      const collector = interaction.channel.createMessageComponentCollector({ time: 60000 });

      collector.on('collect', async i => {
        if (i.customId === 'generate_new') {
          const newNumber = generateRandomNumber();
          const newEmbed = generateEmbed(newNumber);
          await i.update({ embeds: [newEmbed], components: [row] });
        }
      });

      collector.on('end', () => {
        row.components[0].setDisabled(true);
        interaction.editReply({ components: [row] });
      });

    } catch (error) {
      console.error('Error in random command:', error);
      await interaction.editReply({ content: 'An error occurred while processing the command.', ephemeral: true });
    }
  }
};
