const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const User = require('../../models/user'); // User model

module.exports = {
    category: 'utility',
    data: new SlashCommandBuilder()
        .setName('characters')
        .setDescription('List all the characters you own.')
        .setDMPermission(false),
    async execute(interaction) {

        // Fetch user from database
        let user = await User.findOne({ userID: interaction.user.id }).populate('pulledCharacters.characterID');
        if (!user) {
            return interaction.reply('You need to register through `/explore` first to view your characters.');
        }

        const charactersPerPage = 20;
        let currentPage = 1;
        let totalPages = Math.ceil(user.pulledCharacters.length / charactersPerPage);

        if (totalPages === 0) {
            return interaction.reply('You don\'t own any characters yet. Go wish for some!');
        }

        // Function to generate embed for characters list
        const generateEmbed = (page) => {
            const start = (page - 1) * charactersPerPage;
            const end = Math.min(start + charactersPerPage, user.pulledCharacters.length);
            const characters = user.pulledCharacters.slice(start, end);

            let description = characters.map((char, i) => `${start + i + 1}. ${char.name}`).join('\n');
            if (!description) description = 'No characters to show.';

            const embed = new EmbedBuilder()
                .setTitle(`${interaction.user.username}'s Characters List`)
                .setDescription(description)
                .setColor('#FFFFFF')
                .setFooter({ text: `Page ${page} | ${totalPages}` });

            return embed;
        };

        // Create initial embed
        const embed = generateEmbed(currentPage);

        // Create buttons for pagination
        const prevButton = new ButtonBuilder()
            .setCustomId('prev')
            .setLabel('◀️')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(currentPage === 1);

        const nextButton = new ButtonBuilder()
            .setCustomId('next')
            .setLabel('▶️')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(currentPage === totalPages);

        const actionRow = new ActionRowBuilder().addComponents(prevButton, nextButton);

        // Create select menu for character view
        const characterOptions = user.pulledCharacters.map((char) => ({
            label: `❔ View ${char.name}`,
            value: char.name,
        }));

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('select-character')
            .setPlaceholder('Select a character to view')
            .addOptions(characterOptions);

        const selectRow = new ActionRowBuilder().addComponents(selectMenu);

        // Send the initial embed with buttons and select menu
        const message = await interaction.reply({
            embeds: [embed],
            components: [actionRow, selectRow],
            fetchReply: true,
        });

        // Create a button collector for pagination
        const filter = (i) => i.user.id === interaction.user.id;
        const collector = message.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async (i) => {
            if (i.customId === 'prev') {
                currentPage--;
            } else if (i.customId === 'next') {
                currentPage++;
            } else if (i.customId === 'select-character') {
                const characterName = i.values[0];
                const char = user.pulledCharacters.find((char) => char.name === characterName);

                if (char) {
                    const characterEmbed = generateCharacterEmbed(char);
                    // Update the interaction with the character embed
                    return i.update({ embeds: [characterEmbed], components: [] }).catch(console.error);
                } else {
                    // Handle case where character is not found
                    return i.reply({ content: 'Character not found!', ephemeral: true });
                }
            }

            // Update buttons state
            prevButton.setDisabled(currentPage === 1);
            nextButton.setDisabled(currentPage === totalPages);

            const newEmbed = generateEmbed(currentPage);
            await i.update({ embeds: [newEmbed], components: [actionRow, selectRow] });
        });

        collector.on('end', () => {
            prevButton.setDisabled(true);
            nextButton.setDisabled(true);
            interaction.editReply({ components: [actionRow] });
        });
    },
};

// Helper function to generate character embed
function generateCharacterEmbed(char) {
    const embed = new EmbedBuilder()
        .setTitle(char.name)
        .setDescription(`${char.rarity}\n${char.type}\n\`${char.anime}\``)
        .setImage(char.image) // Replace with character image
        .setColor(char.type === 'Quasar' ? '#FF0000' : char.type === 'Pulsar' ? '#0000FF' : char.type === 'Supernova' ? '#FFFF00' : '#FFFFFF')
        .setFooter({ text: `Pulled on: ${char.datePulled.toLocaleDateString()} | ${char.credits}` });

    return embed;
}
