import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import fetch from 'node-fetch';

export default {
  boosterOnly: true,
  data: new SlashCommandBuilder()
    .setName('randomcocktail')
    .setDescription('Get a random cocktail recipe (Booster only)'),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const response = await fetch('https://www.thecocktaildb.com/api/json/v1/1/random.php');
      const data = await response.json();
      const cocktail = data.drinks[0];

      if (!cocktail) {
        return interaction.editReply('Sorry, I couldn\'t fetch a cocktail recipe at the moment. Please try again later.');
      }

      const ingredients = [];
      for (let i = 1; i <= 15; i++) {
        const ingredient = cocktail[`strIngredient${i}`];
        const measure = cocktail[`strMeasure${i}`];
        if (ingredient) {
          ingredients.push(`${measure ? measure.trim() : ''} ${ingredient}`);
        } else {
          break;
        }
      }

      const embed = new EmbedBuilder()
        .setColor('#FF69B4')
        .setTitle(cocktail.strDrink)
        .setDescription(cocktail.strInstructions)
        .addFields(
          { name: 'Ingredients', value: ingredients.join('\n') },
          { name: 'Glass Type', value: cocktail.strGlass, inline: true },
          { name: 'Category', value: cocktail.strCategory, inline: true }
        )
        .setThumbnail(cocktail.strDrinkThumb)
        .setFooter({ text: 'Data from TheCocktailDB.com' });

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error fetching random cocktail:', error);
      await interaction.editReply('An error occurred while fetching the cocktail recipe. Please try again later.');
    }
  },
};