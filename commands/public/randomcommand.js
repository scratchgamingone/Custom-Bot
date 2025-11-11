import { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('randomcommand')
    .setDescription('Execute a random command that you have permission to use'),

  async execute(interaction) {
    await interaction.deferReply();

    const client = interaction.client;
    const member = interaction.member;

    // Get all commands
    const commands = Array.from(client.commands.values());

    // Filter commands based on user permissions
    const availableCommands = commands.filter(command => {
      // Check if the command has any permission requirements
      if (command.adminOnly) {
        return member.permissions.has(PermissionsBitField.Flags.Administrator);
      }
      if (command.ownerOnly) {
        return interaction.user.id === process.env.OWNER_ID;
      }
      // Add more checks here if you have other permission levels

      // If no special permissions are required, the command is available
      return true;
    });

    if (availableCommands.length === 0) {
      return interaction.editReply("You don't have permission to use any commands.");
    }

    // Select a random command
    const randomCommand = availableCommands[Math.floor(Math.random() * availableCommands.length)];

    // Create an embed with information about the selected command
    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('Random Command Selected')
      .setDescription(`The randomly selected command is: **/${randomCommand.data.name}**`)
      .addFields(
        { name: 'Description', value: randomCommand.data.description || 'No description available.' },
        { name: 'How to Use', value: `Use /${randomCommand.data.name} to execute this command directly.` }
      )
      .setTimestamp()
      .setFooter({ text: 'Random Command Selector' });

    await interaction.editReply({ embeds: [embed] });

    // Optionally, you can add a button to execute the command
    // This would require additional code to handle button interactions
  },
};