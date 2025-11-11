import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import fetch from 'node-fetch';

export default {
    data: new SlashCommandBuilder()
        .setName('trivia')
        .setDescription('Get a random trivia question'),

    async execute(interaction) {
        await interaction.deferReply();

        const fetchTriviaQuestion = async () => {
            const response = await fetch('https://opentdb.com/api.php?amount=1&type=multiple');
            const data = await response.json();
            return data.results[0];
        };

        const createTriviaEmbed = (question, showAnswer = false) => {
            const embed = new EmbedBuilder()
                .setColor('#FFA500')
                .setTitle('Trivia Time!')
                .addFields(
                    { name: 'Category', value: question.category, inline: true },
                    { name: 'Difficulty', value: question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1), inline: true },
                    { name: 'Question', value: question.question }
                )
                .setTimestamp()
                .setFooter({ text: 'Powered by Open Trivia Database' });

            if (showAnswer) {
                embed.addFields({ name: 'Answer', value: `||${question.correct_answer}||` });
            }

            return embed;
        };

        try {
            const question = await fetchTriviaQuestion();
            const embed = createTriviaEmbed(question);

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('show_answer')
                        .setLabel('Show Answer')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('new_question')
                        .setLabel('New Question')
                        .setStyle(ButtonStyle.Secondary)
                );

            const response = await interaction.editReply({
                embeds: [embed],
                components: [row],
            });

            const collector = response.createMessageComponentCollector({ time: 60000 });

            collector.on('collect', async i => {
                if (i.customId === 'show_answer') {
                    await i.deferUpdate();
                    const answerEmbed = createTriviaEmbed(question, true);
                    await i.editReply({ embeds: [answerEmbed], components: [row] });
                } else if (i.customId === 'new_question') {
                    await i.deferUpdate();
                    const newQuestion = await fetchTriviaQuestion();
                    const newEmbed = createTriviaEmbed(newQuestion);
                    await i.editReply({ embeds: [newEmbed], components: [row] });
                }
            });

            collector.on('end', () => {
                row.components.forEach(component => component.setDisabled(true));
                interaction.editReply({ components: [row] });
            });

        } catch (error) {
            console.error('Error fetching trivia question:', error);
            await interaction.editReply('Sorry, I couldn\'t fetch a trivia question at the moment. Try again later!');
        }
    },
};