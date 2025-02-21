const { REST, Routes } = require('discord.js');
const { clientId, guildId, token } = require('./config.json');
const fs = require('node:fs');
const path = require('node:path');

// Arrays to store guild and global commands
const guildCommands = [];
const globalCommands = [];

// Path to commands folder
const commandsPath = path.join(__dirname, 'commands');

// Handle guild commands (reload.js in guild folder)
const guildCommandPath = path.join(commandsPath, 'guild');
const guildCommandFiles = fs.readdirSync(guildCommandPath).filter(file => file.endsWith('.js'));

for (const file of guildCommandFiles) {
	const filePath = path.join(guildCommandPath, file);
	const command = require(filePath);
	if ('data' in command && 'execute' in command) {
		guildCommands.push(command.data.toJSON());
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

const utilityCommandPath = path.join(commandsPath, 'utility');
const utilityCommandFiles = fs.readdirSync(utilityCommandPath).filter(file => file.endsWith('.js'));

for (const file of utilityCommandFiles) {
	const filePath = path.join(utilityCommandPath, file);
	const command = require(filePath);
	if ('data' in command && 'execute' in command) {
		globalCommands.push(command.data.toJSON());
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(token);

(async () => {
	try {
		// Deploy Guild-specific Commands
		if (guildCommands.length > 0) {
			console.log(`Started refreshing ${guildCommands.length} guild-specific application (/) commands.`);

			const guildData = await rest.put(
				Routes.applicationGuildCommands(clientId, guildId),
				{ body: guildCommands },
			);

			console.log(`Successfully reloaded ${guildData.length} guild-specific application (/) commands.`);
		}

		// Deploy Global Commands
		if (globalCommands.length > 0) {
			console.log(`Started refreshing ${globalCommands.length} global application (/) commands.`);

			const globalData = await rest.put(
				Routes.applicationCommands(clientId),
				{ body: globalCommands },
			);

			console.log(`Successfully reloaded ${globalData.length} global application (/) commands.`);
		}
		
	} catch (error) {
		console.error(error);
	}
})();