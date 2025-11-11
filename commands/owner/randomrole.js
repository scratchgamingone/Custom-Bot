import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export default {
    ownerOnly: true,
    data: new SlashCommandBuilder()
        .setName('giverandomrole')
        .setDescription('Give a random role to a user or a random member (Owner only)')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to give a random role to (optional)')
                .setRequired(false)),

    async execute(interaction) {
        if (interaction.user.id !== process.env.OWNER_ID) {
            return interaction.reply({ content: 'This command is only available to the bot owner.', ephemeral: true });
        }

        await interaction.deferReply();

        try {
            const guild = interaction.guild;
            await guild.members.fetch();
            await guild.roles.fetch();

            const botMember = guild.members.cache.get(interaction.client.user.id);

            const assignableRoles = guild.roles.cache.filter(role => 
                role.id !== guild.id && 
                !role.managed && 
                botMember.roles.highest.comparePositionTo(role) > 0
            );

            if (assignableRoles.size === 0) {
                return interaction.editReply('There are no assignable roles in this server.');
            }

            const giveRandomRole = async (member) => {
                const memberRoles = member.roles.cache;
                const availableRoles = assignableRoles.filter(role => !memberRoles.has(role.id));

                if (availableRoles.size === 0) {
                    return null; // No available roles for this member
                }

                const randomRole = availableRoles.random();
                await member.roles.add(randomRole);
                return randomRole;
            };

            const getRandomMember = () => {
                return guild.members.cache
                    .filter(member => !member.user.bot)
                    .random();
            };

            let targetUser = interaction.options.getUser('user');
            let targetMember = targetUser ? await guild.members.fetch(targetUser.id) : getRandomMember();
            let attempts = 0;
            const maxAttempts = guild.members.cache.size; // Max attempts is the number of members

            while (attempts < maxAttempts) {
                const randomRole = await giveRandomRole(targetMember);

                if (randomRole) {
                    return interaction.editReply(`${targetMember.user} has been given the random role: ${randomRole.name}`);
                }

                // If no role was assigned, pick a new random member
                targetMember = getRandomMember();
                attempts++;
            }

            await interaction.editReply('Unable to assign a role. All members already have all assignable roles.');

        } catch (error) {
            console.error('Error in giverandomrole command:', error);
            await interaction.editReply('An error occurred while executing the command.');
        }
    },
};