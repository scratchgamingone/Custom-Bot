
import { SlashCommandBuilder } from 'discord.js';
import * as joke from './joke.js';
import * as cat from './cat.js';
import * as dog from './dog.js';

export default {
    data: new SlashCommandBuilder()
        .setName('fun')
        .setDescription('Get fun stuff like jokes and animal pictures.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('joke')
                .setDescription('Get a random joke.'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('cat')
                .setDescription('Get a random cat picture and fact.'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('dog')
                .setDescription('Get a random dog picture.')),
    category: 'public',
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'joke':
                await joke.default.execute(interaction);
                break;
            case 'cat':
                await cat.default.execute(interaction);
                break;
            case 'dog':
                await dog.default.execute(interaction);
                break;
            default:
                await interaction.reply({ content: 'Unknown subcommand.', ephemeral: true });
        }
    },
};
