// commands/title.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const User = require('../../models/user'); // Import the User model
const Character = require('../../models/character'); // Import the Character model

module.exports = {
    catgeory: 'guild',
    data: new SlashCommandBuilder()
        .setName('change')
        .setDescription('Change the anime title or credits for a character')
        .addStringOption(option =>
            option.setName('character')
                .setDescription('The name of the character')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('anime')
                .setDescription('The new anime title')
                .setRequired(false)) // Not required if only credits are being changed
        .addStringOption(option =>
            option.setName('credits')
                .setDescription('The new credits value')
                .setRequired(false)) // Optional field for changing credits
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), // Restrict to admin only
    async execute(interaction) {
        const characterName = interaction.options.getString('character');
        const animeTitle = interaction.options.getString('anime');
        const credits = interaction.options.getString('credits');

        try {
            // Find the character by name
            const character = await Character.findOne({ name: characterName });

            if (!character) {
                return interaction.reply({ content: 'Character not found!', ephemeral: true });
            }

            // Prepare update object
            const updateData = {};
            if (animeTitle) updateData.anime = animeTitle;
            if (credits) updateData.credits = credits;

            // Update the character
            await Character.updateOne(
                { _id: character._id }, // Match the character by ID
                { $set: updateData } // Set the new values
            );

            // Update the anime title and credits for all users
            const userUpdateData = {};
            if (animeTitle) userUpdateData['pulledCharacters.$[elem].anime'] = animeTitle;
            if (credits) userUpdateData['pulledCharacters.$[elem].credits'] = credits;

            await User.updateMany(
                { 'pulledCharacters.characterID': character._id }, // Match users with this character
                { $set: userUpdateData },
                { arrayFilters: [{ 'elem.characterID': character._id }] } // Update only the matching character
            );

            let replyMessage = `Updated `;
            if (animeTitle) replyMessage += `anime title for ${characterName} to "${animeTitle}" `;
            if (credits) replyMessage += `and credits to "${credits}" `;
            replyMessage += `for all users.`;

            interaction.reply({ content: replyMessage, ephemeral: true });
        } catch (error) {
            console.error('Error updating character details:', error);
            interaction.reply({ content: 'An error occurred while updating the character details.', ephemeral: true });
        }
    },
};
