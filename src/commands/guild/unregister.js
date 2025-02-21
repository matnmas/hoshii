const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const currentUser = require('../../models/user'); // Adjust the path as needed

module.exports = {
    category: 'guild',
    data: new SlashCommandBuilder()
        .setName('unregister')
        .setDescription('Remove a mentioned user from the database and delete all associated currency data.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to unregister')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        // Check if the user is an admin
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            await interaction.reply('You do not have permission to use this command.');
            return;
        }

        // Get the mentioned user
        const user = interaction.options.getUser('user');
        if (!user) {
            await interaction.reply('You must mention a user to unregister.');
            return;
        }

        const userID = user.id;
        try {
            // Remove the user’s data from both collections
            const result = await currentUser.deleteOne({ userID });

            if (result.deletedCount === 0) {
                // User not found in either collection
                await interaction.reply('User not found or has already been removed.');
                return;
            }

            // Success message
            await interaction.reply(`User ${user.username} has been removed and all associated currency has been deleted.`);
        } catch (error) {
            console.error('Error removing user data:', error);
            await interaction.reply('There was an error removing the user data.');
        }
    },
};
