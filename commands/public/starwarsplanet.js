import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import https from 'https';
import fetch from 'node-fetch';

export default {
  data: new SlashCommandBuilder()
    .setName('starwarsplanet')
    .setDescription('Get information about a Star Wars planet')
    .addIntegerOption(option =>
      option.setName('id')
        .setDescription('The ID of the planet (1-60, or leave empty for a random planet)')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(60)),

  async execute(interaction) {
    await interaction.deferReply();

    let planetId = interaction.options.getInteger('id');
    if (!planetId) {
      planetId = Math.floor(Math.random() * 60) + 1; // Random number between 1 and 60
    }

    const agent = new https.Agent({
      rejectUnauthorized: false
    });

    try {
      const response = await fetch(`https://swapi.dev/api/planets/${planetId}/`, { agent });
      
      if (!response.ok) {
        throw new Error('Failed to fetch planet data');
      }

      const data = await response.json();

      const embed = new EmbedBuilder()
        .setColor('#FFE81F')  // Star Wars yellow
        .setTitle(`Planet: ${data.name}`)
        .addFields(
          { name: 'Climate', value: data.climate || 'Unknown', inline: true },
          { name: 'Terrain', value: data.terrain || 'Unknown', inline: true },
          { name: 'Population', value: data.population || 'Unknown', inline: true },
          { name: 'Diameter', value: data.diameter ? `${data.diameter} km` : 'Unknown', inline: true },
          { name: 'Gravity', value: data.gravity || 'Unknown', inline: true },
          { name: 'Orbital Period', value: data.orbital_period ? `${data.orbital_period} days` : 'Unknown', inline: true },
          { name: 'Rotation Period', value: data.rotation_period ? `${data.rotation_period} hours` : 'Unknown', inline: true }
        )
        .setFooter({ text: `Data from SWAPI (Star Wars API) | Planet ID: ${planetId}` })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error fetching Star Wars planet data:', error);
      await interaction.editReply('There was an error fetching the planet information. Please try again later.');
    }
  },
};
