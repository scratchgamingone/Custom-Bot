
import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import fetch from 'node-fetch';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { promises as fs } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default {
    data: new SlashCommandBuilder()
        .setName('urban')
        .setDescription('Get the definition of a word from Urban Dictionary')
        .addStringOption(option =>
            option.setName('term')
                .setDescription('The word to define')
                .setRequired(false)),
    
    async execute(interaction) {
        await interaction.deferReply();

        let term = interaction.options.getString('term');
        let result;
        let attempts = 0;
        const maxAttempts = 20; // To prevent infinite loops

        try {
            if (term) {
                const response = await fetch(`https://api.urbandictionary.com/v0/define?term=${encodeURIComponent(term)}`);
                const data = await response.json();
                if (data.list && data.list.length > 0) {
                    result = data.list[0];
                } else {
                    return interaction.editReply(`No definition found for **${term}**.`);
                }
            } else {
                // Get a random word if no term is provided
                const wordsFilePath = join(__dirname, '..', 'words.txt');
                const fileContent = await fs.readFile(wordsFilePath, 'utf-8');
                const words = fileContent.split('\n').filter(word => word.trim() !== '');

                if (words.length === 0) {
                    return interaction.editReply('The words list is empty, cannot fetch a random definition.');
                }

                // Find a random word with a valid definition
                while (!result && attempts < maxAttempts) {
                    const randomTerm = words[Math.floor(Math.random() * words.length)];
                    const response = await fetch(`https://api.urbandictionary.com/v0/define?term=${encodeURIComponent(randomTerm)}`);
                    const data = await response.json();
                    if (data.list && data.list.length > 0) {
                        result = data.list[0];
                    }
                    attempts++;
                }

                if (!result) {
                    return interaction.editReply('Could not find a definition for a random word after several attempts. Please try again.');
                }
            }

            // Function to clean and truncate text
            const cleanText = (text, maxLength) => {
                if (!text) return 'N/A';
                const cleaned = text.replace(/\[|\]/g, ''); // Remove brackets
                return cleaned.length > maxLength ? `${cleaned.substring(0, maxLength - 3)}...` : cleaned;
            };

            const embed = new EmbedBuilder()
                .setColor('#1D2439')
                .setTitle(result.word)
                .setURL(result.permalink)
                .setDescription(cleanText(result.definition, 4096))
                .addFields(
                    { name: 'Example', value: cleanText(result.example, 1024) },
                    { name: 'Rating', value: `👍 ${result.thumbs_up} | 👎 ${result.thumbs_down}`, inline: true }
                )
                .setTimestamp(new Date(result.written_on))
                .setFooter({ text: `By ${result.author}` });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error in urban command:', error);
            await interaction.editReply('An error occurred while fetching the definition. Please try again later.');
        }
    },
};
