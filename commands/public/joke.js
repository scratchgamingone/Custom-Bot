
import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import fetch from 'node-fetch';
export default {
  data: new SlashCommandBuilder()
    .setName('joke')
    .setDescription('Get a random joke'),
  category: 'public',

  async execute(interaction) {
// ... existing code
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


      );      const response = await interaction.editReply({
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

      const embed = new EmbedBuilder()
       .setColor('#FF0000')
       .setTitle('Error Fetching Joke')
       .setDescription('An error occurred while fetching the joke. Please try again later.')
       .setTimestamp()
       .setFooter({ text: 'Powered by official-joke-api.appspot.com' });


       await interaction.editReply({ embeds: [embed] });
       collector.stop();
       row.components[0].setDisabled(true);
       interaction.editReply({ components: [row] });





    }  }
};  