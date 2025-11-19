
import { promises as fs } from 'fs';
import { EmbedBuilder } from 'discord.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default {
    // The data property is now managed in fun.js
    category: 'public',

    async execute(interaction) {
        await interaction.deferReply();

        const count = interaction.options.getInteger('count') ?? 1;

        try {
            const wordsFilePath = join(__dirname, '..', 'words.txt');
            const fileContent = await fs.readFile(wordsFilePath, 'utf-8');
            const words = fileContent.split('\n').filter(word => word.trim() !== '');

            if (words.length === 0) {
                return interaction.editReply('The words list is empty.');
            }

            const randomWords = [];
            for (let i = 0; i < count; i++) {
                const randomIndex = Math.floor(Math.random() * words.length);
                randomWords.push(words[randomIndex]);
            }

            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle(count > 1 ? 'Your Random Words' : 'Your Random Word')
                .setDescription(randomWords.join('\n'))
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error in randomword command:', error);
            await interaction.editReply('An error occurred while getting a random word.');
        }
    },
};
