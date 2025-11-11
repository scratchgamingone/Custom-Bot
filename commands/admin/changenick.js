import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import fs from 'fs/promises';
import path from 'path';

export default {
  adminOnly: true,
  data: new SlashCommandBuilder()
    .setName('changenick')
    .setDescription('Change the nickname of a user')
    .addUserOption(option =>
      option.setName('target')
        .setDescription('The user to change the nickname of')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('nickname')
        .setDescription('The new nickname (leave empty for random or to be prompted)')
        .setRequired(false))
    .addBooleanOption(option =>
      option.setName('random')
        .setDescription('Use a random word from words.txt as the nickname')
        .setRequired(false)),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageNicknames)) {
      return interaction.editReply("You need the 'Manage Nicknames' permission to use this command.");
    }

    const target = interaction.options.getUser('target');
    let newNickname = interaction.options.getString('nickname');
    const useRandom = interaction.options.getBoolean('random');

    if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageNicknames)) {
      return interaction.editReply("I don't have permission to change nicknames.");
    }

    try {
      const member = await interaction.guild.members.fetch(target.id);
      
      if (member.id === interaction.guild.ownerId) {
        return interaction.editReply("I can't change the nickname of the server owner.");
      }

      if (!member.manageable) {
        return interaction.editReply("I can't manage this user's nickname due to role hierarchy.");
      }

      if (useRandom) {
        newNickname = await getRandomWord();
        if (!newNickname) {
          return interaction.editReply("Failed to get a random word. Please try again or provide a nickname.");
        }
      } else if (!newNickname) {
        await interaction.editReply("Please enter the new nickname:");
        const filter = m => m.author.id === interaction.user.id;
        const collected = await interaction.channel.awaitMessages({ filter, max: 1, time: 30000 });
        
        if (collected.size === 0) {
          return interaction.followUp("No nickname provided. Command cancelled.");
        }
        
        newNickname = collected.first().content;
        await collected.first().delete();
      }

      await member.setNickname(newNickname);
      await interaction.editReply(`Successfully changed ${target.username}'s nickname to "${newNickname}"`);
    } catch (error) {
      console.error('Error changing nickname:', error);
      if (error.code === 50013) {
        await interaction.editReply("I don't have permission to change this user's nickname. They might have higher permissions than me.");
      } else {
        await interaction.editReply(`Failed to change nickname. Error: ${error.message}`);
      }
    }
  },
};

async function getRandomWord() {
  try {
    const filePath = path.join(process.cwd(), 'commands', 'words.txt');
    const data = await fs.readFile(filePath, 'utf8');
    const words = data.split('\n').filter(word => word.trim() !== '');
    return words[Math.floor(Math.random() * words.length)].trim();
  } catch (error) {
    console.error('Error reading words.txt:', error);
    return null;
  }
} 