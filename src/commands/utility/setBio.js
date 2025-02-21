const { SlashCommandBuilder } = require('discord.js');
const User = require('../../models/user'); // Assuming you already have a User model

module.exports = {
    category: 'utility',
    data: new SlashCommandBuilder()
        .setName('setbio')
        .setDescription('Set your profile bio')
        .setDMPermission(false)
        .addStringOption(option =>
            option.setName('bio')
                .setDescription('Your new bio (Max 250 characters)')
                .setRequired(true)
                .setMaxLength(250)
        ),
    async execute(interaction) {
        // Ensure the command is used only in servers (guilds), not in DMs
        if (!interaction.inGuild()) {
            await interaction.reply('You can only use this command in a server.');
            return;
        }

        // Defer the reply for processing
        await interaction.deferReply();

        // Fetch the bio from the user input
        const bio = interaction.options.getString('bio');
        const userId = interaction.user.id;

        // Check if the user is registered
        let userData = await User.findOne({ userID: userId });

        // If user is not found, prompt them to register using /explore
        if (!userData) {
            await interaction.editReply('You need to register using the `/explore` command before setting a bio.');
            return;
        }

        // Update the user's bio in the database
        userData.bio = bio;
        await userData.save(); // Save the updated data

        // Confirm the bio change to the user
        await interaction.editReply(`Your bio has been updated to:\n\`${bio}\``);
    },
};
