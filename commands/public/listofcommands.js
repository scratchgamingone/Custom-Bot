import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function loadCommands(folder) {
  const commands = [];
  const commandsPath = join(__dirname, '..', folder);
  const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = join(commandsPath, file);
    const commandModule = await import(`file://${filePath}`);
    const command = commandModule.default;
    if (command && 'data' in command && 'execute' in command) {
      commands.push({
        name: command.data.name,
        description: command.data.description
      });
    }
  }

  return commands;
}

export default {
  data: new SlashCommandBuilder()
    .setName('listofcommands')
    .setDescription('Show a list of all available commands'),

  async execute(interaction) {
    try {
      await interaction.deferReply();

      const commandsPerPage = 5;
      const publicCommands = await loadCommands('public');
      const boosterCommands = await loadCommands('booster');
      const adminCommands = await loadCommands('admin');
      const ownerCommands = await loadCommands('owner');
      const allCommands = publicCommands.concat(boosterCommands, adminCommands, ownerCommands);

      const generateEmbed = (commands, title, paginated = true) => {
        if (!paginated) {
          return new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(title)
            .setDescription(commands.map(cmd => `**/${cmd.name}** - ${cmd.description}`).join('\n'))
            .setFooter({ text: `${commands.length} total commands` });
        }

        const totalPages = Math.ceil(commands.length / commandsPerPage);
        let currentPage = 1;

        const generatePageEmbed = (page) => {
          const start = (page - 1) * commandsPerPage;
          const end = start + commandsPerPage;
          const pageCommands = commands.slice(start, end);

          return new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(title)
            .setDescription(pageCommands.map(cmd => `**/${cmd.name}** - ${cmd.description}`).join('\n'))
            .setFooter({ text: `Page ${page}/${totalPages} | ${commands.length} total commands` });
        };

        return { embed: generatePageEmbed, totalPages, currentPage };
      };

      const allCommandsView = generateEmbed(allCommands, 'All Commands');
      const publicCommandsView = generateEmbed(publicCommands, 'Public Commands');
      const boosterCommandsView = generateEmbed(boosterCommands, 'Booster Commands');
      const adminCommandsView = generateEmbed(adminCommands, 'Admin Commands');
      const ownerCommandsView = generateEmbed(ownerCommands, 'Owner Commands');
      const allCommandsNoPagination = generateEmbed(allCommands, 'All Commands (No Pagination)', false);

      let currentView = allCommandsView;

      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('previous')
            .setLabel('Previous')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId('next')
            .setLabel('Next')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(currentView.totalPages === 1),
          new ButtonBuilder()
            .setCustomId('all')
            .setLabel('All Commands')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('public')
            .setLabel('Public Commands')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('booster')
            .setLabel('Booster Commands')
            .setStyle(ButtonStyle.Secondary)
        );

      const adminRow = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('admin')
            .setLabel('Admin Commands')
            .setStyle(ButtonStyle.Danger)
        );

      const ownerRow = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('owner')
            .setLabel('Owner Commands')
            .setStyle(ButtonStyle.Danger)
        );

      const showAllRow = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('show_all')
            .setLabel('Show All Commands')
            .setStyle(ButtonStyle.Success)
        );

      const goBackRow = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('go_back')
            .setLabel('Go Back')
            .setStyle(ButtonStyle.Primary)
        );

      const isAdmin = interaction.member.roles.cache.has(process.env.ADMIN_ROLE_ID);
      const isOwner = interaction.user.id === process.env.OWNER_ID;

      const message = await interaction.editReply({
        embeds: [currentView.embed(currentView.currentPage)],
        components: isOwner ? [row, adminRow, ownerRow, showAllRow] : 
                    isAdmin ? [row, adminRow, showAllRow] : 
                    [row, showAllRow]
      });

      const collector = message.createMessageComponentCollector({ time: 300000 }); // 5 minutes

      collector.on('collect', async i => {
        if (i.customId === 'previous') {
          currentView.currentPage--;
        } else if (i.customId === 'next') {
          currentView.currentPage++;
        } else if (i.customId === 'all') {
          currentView = allCommandsView;
          currentView.currentPage = 1;
        } else if (i.customId === 'public') {
          currentView = publicCommandsView;
          currentView.currentPage = 1;
        } else if (i.customId === 'booster') {
          currentView = boosterCommandsView;
          currentView.currentPage = 1;
        } else if (i.customId === 'admin') {
          if (isAdmin || isOwner) {
            currentView = adminCommandsView;
            currentView.currentPage = 1;
          } else {
            await i.reply({ content: "You don't have permission to view admin commands.", ephemeral: true });
            return;
          }
        } else if (i.customId === 'owner') {
          if (isOwner) {
            currentView = ownerCommandsView;
            currentView.currentPage = 1;
          } else {
            await i.reply({ content: "You don't have permission to view owner commands.", ephemeral: true });
            return;
          }
        } else if (i.customId === 'show_all') {
          await i.update({
            embeds: [allCommandsNoPagination],
            components: [goBackRow]
          });
          return;
        } else if (i.customId === 'go_back') {
          currentView = allCommandsView;
          currentView.currentPage = 1;
          await i.update({
            embeds: [currentView.embed(currentView.currentPage)],
            components: isOwner ? [row, adminRow, ownerRow, showAllRow] : 
                        isAdmin ? [row, adminRow, showAllRow] : 
                        [row, showAllRow]
          });
          return;
        }

        row.components[0].setDisabled(currentView.currentPage === 1);
        row.components[1].setDisabled(currentView.currentPage === currentView.totalPages);

        await i.update({
          embeds: [currentView.embed(currentView.currentPage)],
          components: isOwner ? [row, adminRow, ownerRow, showAllRow] : 
                      isAdmin ? [row, adminRow, showAllRow] : 
                      [row, showAllRow]
        });
      });

      collector.on('end', () => {
        row.components.forEach(button => button.setDisabled(true));
        adminRow.components[0].setDisabled(true);
        ownerRow.components[0].setDisabled(true);
        showAllRow.components[0].setDisabled(true);
        goBackRow.components[0].setDisabled(true);
        interaction.editReply({ 
          components: isOwner ? [row, adminRow, ownerRow, showAllRow] : 
                      isAdmin ? [row, adminRow, showAllRow] : 
                      [row, showAllRow] 
        });
      });
    } catch (error) {
      console.error('Error in listofcommands command:', error);
      await interaction.editReply({ content: `An error occurred while processing the command. Error details: ${error.message}`, ephemeral: true });
    }
  }
};