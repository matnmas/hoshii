const { SlashCommandBuilder } = require('discord.js');
const newUser = require('../../models/user'); // Adjust the path as needed

module.exports = {
    category: 'utility',
    data: new SlashCommandBuilder()
        .setName('explore')
        .setDescription('Register and receive some initial free rewards!')
        .setDMPermission(false),
    async execute(interaction) {
        const userID = interaction.user.id;
        try {
            // Check if user is already registered in collection
            const user = await newUser.findOne({ userID });

            if (user) {
                // User is already registered
                await interaction.reply('You have already been registered!');
                return;
            }

            // Register new user with initial values
            await newUser.create({ userID, stars: 1600, comet: 10, crescent: 10, lastDaily: null});

            await interaction.reply(`Welcome to **Hoshii Galaxy** 🌌 <@${userID}>!!!!
You have received \`free\` rewards upon registering ✨

\`1600\` stars ⭐
\`10\` comets ☄️
\`10\` crescents 🌙
            
Explore the vast galaxy within **hoshii** 💫
\`/wish\` to get your first character rolls ✨`);
            
        } catch (error) {
            console.error('Error registering user:', error);
            await interaction.reply('There was an error registering you.');
        }
    },
};
