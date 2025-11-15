
import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { promises as fs } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default {
    data: new SlashCommandBuilder()
        .setName('randomword')
        .setDescription('Get one or more random words.')
        .addIntegerOption(option =>
            option.setName('count')
                .setDescription('The number of random words to get (default: 1, max: 100).')
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(100)),
    category: 'public',

    async execute(interaction) {
        await interaction.deferReply();

        const count = interaction.options.getInteger('count') ?? 1;

        try {
            const wordsFilePath = join(__dirname, '..', 'words.txt');
            const fileContent = await fs.readFile(wordsFilePath, 'utf-8');
            const words = fileContent.split('\n').filter(word => word.trim() !== '' && /^[a-zA-Z]+$/.test(word));

            if (words.length === 0) {
                return interaction.editReply('The words list is empty or contains no valid words, cannot fetch random words.');
            }

            const randomWords = [];
            for (let i = 0; i < count; i++) {
                const randomIndex = Math.floor(Math.random() * words.length);
                randomWords.push(words[randomIndex]);
            }

            const embed = new EmbedBuilder()
                .setColor('#fa0808ff')
                .setTitle(count > 1 ? 'Here are your random words!' : 'Here is your random word!')
                .setDescription(randomWords.join(', '))
                .setTimestamp()
                .setFooter({ text: `Requested by ${interaction.user.username}` });

            // The description has a limit of 4096 characters. If the list is too long, send as a file.
            if (embed.data.description.length > 4096) {
                await interaction.editReply({
                    content: `Here are your ${count} random words:`,
                    files: [{
                        attachment: Buffer.from(randomWords.join('\n')),
                        name: 'random-words.txt'
                    }]
                });
            } else {
                await interaction.editReply({ embeds: [embed] });
            }

        } catch (error) {
            console.error('Error in randomword command:', error);
            await interaction.editReply('An error occurred while fetching random words. Please try again later.');
        }
    },
};
