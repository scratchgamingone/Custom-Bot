import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import fetch from 'node-fetch';

export default {
  data: new SlashCommandBuilder()
    .setName('joke')
    .setDescription('Get a random joke'),

  async execute(interaction) {
    await interaction.deferReply();

    const fetchJoke = async () => {
      const response = await fetch('https://official-joke-api.appspot.com/random_joke');
      return response.json();
    };

    const createJokeEmbed = (joke) => {
      return new EmbedBuilder()
        .setColor('#FFA500')
        .setTitle('Here\'s a joke for you!')
        .addFields(
          { name: 'Setup', value: joke.setup },
          { name: 'Punchline', value: `||${joke.punchline}||` }
        )
        .setTimestamp()
        .setFooter({ text: 'Powered by Official Joke API' });
    };

    try {
      const joke = await fetchJoke();
      const embed = createJokeEmbed(joke);

      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('new_joke')
            .setLabel('Get Another Joke')
            .setStyle(ButtonStyle.Primary),
        );

      const response = await interaction.editReply({
        embeds: [embed],
        components: [row],
      });

      const collector = response.createMessageComponentCollector({ time: 60000 });

      collector.on('collect', async i => {
        if (i.customId === 'new_joke') {
          await i.deferUpdate();
          const newJoke = await fetchJoke();
          const newEmbed = createJokeEmbed(newJoke);
          await i.editReply({ embeds: [newEmbed], components: [row] });
        }
      });

      collector.on('end', () => {
        row.components[0].setDisabled(true);
        interaction.editReply({ components: [row] });
      });

    } catch (error) {
      console.error('Error fetching joke:', error);
      await interaction.editReply('Sorry, I couldn\'t fetch a joke at the moment. Try again later!');
    }
  }
};