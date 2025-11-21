
import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js';

const createCommandListEmbed = (title, description, commandList) => {
    const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(title)
        .setDescription(description);

    if (commandList.size > 0) {
        const commandFields = commandList.map(cmd => ({
            name: `/${cmd.data.name}`,
            value: cmd.data.description || 'No description available.',
            inline: false
        }));
        embed.addFields(commandFields);
    } else {
        embed.addFields({ name: 'No Commands Found', value: 'There are no commands in this category.' });
    }

    return embed;
};

export default {
    data: new SlashCommandBuilder()
        .setName('listofcommands')
        .setDescription('Displays a list of available commands with filters.'),

    async execute(interaction) {
        const { client, member, user } = interaction;
        const commands = client.commands;

        const ownerId = process.env.OWNER_ID;
        const adminRoleId = process.env.ADMIN_ROLE_ID;
        const boosterRoleId = process.env.BOOSTER_ROLE_ID;

        const filters = {
            all: () => ({ list: commands, title: 'All Commands' }),
            public: () => ({
                list: commands.filter(cmd => !cmd.adminOnly && !cmd.ownerOnly && !cmd.boosterOnly),
                title: 'Public Commands'
            }),
            booster: () => ({
                list: commands.filter(cmd => cmd.boosterOnly),
                title: 'Booster-Only Commands'
            }),
            admin: () => ({
                list: commands.filter(cmd => cmd.adminOnly),
                title: 'Admin-Only Commands'
            }),
            owner: () => ({
                list: commands.filter(cmd => cmd.ownerOnly),
                title: 'Owner-Only Commands'
            }),
            my: () => ({
                list: commands.filter(cmd => {
                    if (cmd.ownerOnly) return user.id === ownerId;
                    if (cmd.adminOnly) return member.roles.cache.has(adminRoleId);
                    if (cmd.boosterOnly) return member.roles.cache.has(boosterRoleId);
                    return true; // Public command
                }),
                title: 'My Accessible Commands'
            })
        };

        const initialFilter = filters.all();
        const embed = createCommandListEmbed(initialFilter.title, 'Here are all the commands available.', initialFilter.list);

        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId('all').setLabel('All').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('public').setLabel('Public').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('booster').setLabel('Booster').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('admin').setLabel('Admin').setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId('my').setLabel('My Commands').setStyle(ButtonStyle.Primary)
            );

        const response = await interaction.reply({
            embeds: [embed],
            components: [buttons],
            ephemeral: true
        });

        const collector = response.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 120000 // 2 minutes
        });

        collector.on('collect', async i => {
            const filterType = i.customId;
            const { list, title } = filters[filterType]();
            const description = `Showing commands for the "${filterType}" category.`;
            const newEmbed = createCommandListEmbed(title, description, list);

            await i.update({ embeds: [newEmbed] });
        });

        collector.on('end', () => {
            buttons.components.forEach(button => button.setDisabled(true));
            interaction.editReply({ components: [buttons] });
        });
    },
};
