
import { SlashCommandBuilder } from 'discord.js';
import { config } from 'dotenv';

config(); // Load .env variables

export default {
    data: new SlashCommandBuilder()
        .setName('checkbooster')
        .setDescription('Check if you are a server booster.'),
    category: 'public',

    async execute(interaction) {
        const boosterRoleId = process.env.BOOSTER_ROLE_ID;

        if (!boosterRoleId) {
            console.error('BOOSTER_ROLE_ID is not defined in the .env file.');
            return interaction.reply({
                content: 'The booster role is not configured for this bot. Please contact an administrator.',
                ephemeral: true
            });
        }

        const isBooster = interaction.member.roles.cache.has(boosterRoleId);

        if (isBooster) {
            await interaction.reply({
                content: '✅ Yes, you are a server booster! Thank you for your support!',
                ephemeral: true
            });
        } else {
            await interaction.reply({
                content: '❌ No, you are not currently a server booster.',
                ephemeral: true
            });
        }
    }
};
