const { Events } = require('discord.js');
const userExp = require('../utils/userExp'); // Adjust path to your leveling file

module.exports = {
    name: Events.MessageCreate,
    async execute(message) { 
        if (message.author.bot) return; 

        await userExp(message.client, message);

        // 2. Check if the message is "hping" and handle the command
        if (message.content === 'hping') {
            const command = message.client.commands.get('ping'); // Get the 'ping' command from commands collection
            if (command && command.handleTextCommand) {
                await command.handleTextCommand(message); // Call the text command handler in ping.js
            }
        }
    }
};
