
const { Events } = require('discord.js');

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		console.log(`Online! Logged in as ${client.user.tag}`);
	}
};

