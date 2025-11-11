import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MAX_WORDS = 200;
const MIN_RANDOM_WORDS = 1;
const MAX_RANDOM_WORDS = 100;

export default {
    data: new SlashCommandBuilder()
        .setName('randomword')
        .setDescription('Get random word(s) from the words list')
        .addStringOption(option =>
            option.setName('letter')
                .setDescription('Start letter of the words (optional)')
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('count')
                .setDescription(`Number of words to return (optional, default: random between ${MIN_RANDOM_WORDS}-${MAX_RANDOM_WORDS})`)
                .setRequired(false)
                .setMinValue(1)),

    async execute(interaction) {
        await interaction.deferReply();

        try {
            const wordsFilePath = join(__dirname, '..', 'words.txt');
            const fileContent = await fs.readFile(wordsFilePath, 'utf-8');
            let words = fileContent.split('\n').filter(word => word.trim() !== '');

            const startLetter = interaction.options.getString('letter');
            let count = interaction.options.getInteger('count');
            
            // If no count is provided, generate a random number between MIN_RANDOM_WORDS and MAX_RANDOM_WORDS
            if (!count) {
                count = Math.floor(Math.random() * (MAX_RANDOM_WORDS - MIN_RANDOM_WORDS + 1)) + MIN_RANDOM_WORDS;
            }
            
            // Limit count to MAX_WORDS
            if (count > MAX_WORDS) {
                count = MAX_WORDS;
            }

            if (startLetter) {
                const letter = startLetter.toLowerCase();
                words = words.filter(word => word.toLowerCase().startsWith(letter));
            }

            if (words.length === 0) {
                return interaction.editReply(startLetter ? 
                    `No words found starting with '${startLetter}'.` : 
                    'The words list is empty.');
            }

            const selectedWords = [];
            for (let i = 0; i < count && words.length > 0; i++) {
                const randomIndex = Math.floor(Math.random() * words.length);
                selectedWords.push(words[randomIndex]);
                words.splice(randomIndex, 1); // Remove the selected word to avoid duplicates
            }

            // Sort the selected words alphabetically
            selectedWords.sort((a, b) => a.localeCompare(b));

            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('Random Word(s)')
                .setDescription(`Here ${selectedWords.length === 1 ? 'is' : 'are'} your ${selectedWords.length} random word${selectedWords.length === 1 ? '' : 's'} (in alphabetical order):`)
                .setTimestamp()
                .setFooter({ text: 'Random Word Generator' });

            if (startLetter) {
                embed.setDescription(embed.data.description + ` (Starting with '${startLetter}')`);
            }

            // Split the words into fields of 1024 characters or less
            let currentField = '';
            for (const word of selectedWords) {
                if (currentField.length + word.length + 1 > 1024) {
                    embed.addFields({ name: '\u200B', value: currentField.trim() });
                    currentField = '';
                }
                currentField += word + '\n';
            }
            if (currentField) {
                embed.addFields({ name: '\u200B', value: currentField.trim() });
            }

            // Add a note if the count was limited
            if (count > MAX_WORDS) {
                embed.addFields({ name: 'Note', value: `The number of words was limited to the maximum of ${MAX_WORDS}.` });
            }

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Error in randomword command:', error);
            await interaction.editReply('An error occurred while processing the command.');
        }
    },
};
