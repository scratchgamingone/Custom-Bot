
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } from 'discord.js';
export default {
  data: new SlashCommandBuilder()
    .setName('joke')
    .setDescription('Tells a random joke.'),
  category: 'public',

  async execute(interaction) {
    await interaction.deferReply();

    const fetchJoke = async () => {
      const response = await fetch('https://official-joke-api.appspot.com/random_joke');
      const data = await response.json();
      return data;
    };                 
    const createJokeEmbed = (joke) => {
      return new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(joke.setup)
        .setDescription(joke.punchline)
        .setTimestamp()
        .setFooter({ text: 'Powered by official-joke-api.appspot.com' });
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
      console.error('Error in joke command:', error);
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ content: 'Oops! Something went wrong while telling a joke.', embeds: [], components: [] });
      } else {
        await interaction.reply({ content: 'Oops! Something went wrong while telling a joke.', ephemeral: true });
      }
    }
  },
};
