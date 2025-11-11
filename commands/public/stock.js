import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const ALPHA_VANTAGE_API_KEY = process.env.YOUR_ALPHA_VANTAGE_API_KEY;

export default {
  data: new SlashCommandBuilder()
    .setName('stock')
    .setDescription('Get stock information')
    .addStringOption(option =>
      option.setName('symbol')
        .setDescription('Stock symbol or company name (optional)')
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const userInput = interaction.options.getString('symbol');
    let symbol;

    try {
      if (userInput) {
        // Search for the stock based on user input
        const searchResponse = await fetch(`https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(userInput)}&apikey=${ALPHA_VANTAGE_API_KEY}`);
        const searchData = await searchResponse.json();

        if (searchData.bestMatches && searchData.bestMatches.length > 0) {
          // Randomly select one of the top 5 matches (or less if fewer matches are found)
          const topMatches = searchData.bestMatches.slice(0, 5);
          const randomMatch = topMatches[Math.floor(Math.random() * topMatches.length)];
          symbol = randomMatch['1. symbol'];
        } else {
          // If no match found, get a random stock
          symbol = await getRandomStock();
        }
      } else {
        // If no input provided, get a random stock
        symbol = await getRandomStock();
      }

      // Fetch stock data
      const response = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`);
      const data = await response.json();

      if (data['Global Quote'] && Object.keys(data['Global Quote']).length > 0) {
        const quote = data['Global Quote'];
        const price = parseFloat(quote['05. price']);
        const change = parseFloat(quote['09. change']);
        const changePercent = quote['10. change percent'];

        const embed = new EmbedBuilder()
          .setColor(change >= 0 ? '#00FF00' : '#FF0000')
          .setTitle(`Stock Information: ${symbol}`)
          .addFields(
            { name: 'Price', value: `$${price.toFixed(2)}`, inline: true },
            { name: 'Change', value: `$${change.toFixed(2)} (${changePercent})`, inline: true },
            { name: 'Open', value: `$${parseFloat(quote['02. open']).toFixed(2)}`, inline: true },
            { name: 'High', value: `$${parseFloat(quote['03. high']).toFixed(2)}`, inline: true },
            { name: 'Low', value: `$${parseFloat(quote['04. low']).toFixed(2)}`, inline: true },
            { name: 'Volume', value: quote['06. volume'], inline: true }
          )
          .setTimestamp()
          .setFooter({ text: 'Stock Information' });

        await interaction.editReply({ embeds: [embed] });
      } else {
        await interaction.editReply('Unable to fetch stock information. Please try again later.');
      }
    } catch (error) {
      console.error('Error in stock command:', error);
      await interaction.editReply('An error occurred while fetching stock information. Please try again later.');
    }
  }
};

async function getRandomStock() {
  // This is a simplified example. In a real-world scenario, you might want to use a more comprehensive list of stocks.
  const popularStocks = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'META', 'TSLA', 'NVDA', 'JPM', 'JNJ', 'V', 'WMT', 'PG', 'XOM', 'BAC', 'DIS'];
  return popularStocks[Math.floor(Math.random() * popularStocks.length)];
}