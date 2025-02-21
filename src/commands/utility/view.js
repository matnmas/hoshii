const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const User = require('../../models/user');

module.exports = {
    category: 'utility',
    data: new SlashCommandBuilder()
        .setName('view')
        .setDescription('View a character you own.')
        .setDMPermission(false)
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Name of the character')
                .setRequired(true)),

    async execute(interaction) {
        // Fetch user from the database
        const user = await User.findOne({ userID: interaction.user.id }).populate('pulledCharacters.characterID');
        if (!user) {
            return interaction.reply({ content: 'You need to register through `/explore` first to view a character.', ephemeral: true });
        }

        const charName = interaction.options.getString('name');
        const char = user.pulledCharacters.find(c => c.name.toLowerCase() === charName.toLowerCase());

        if (!char) {
            return interaction.reply({ content: 'You don\'t own this character or the character doesn’t exist.', ephemeral: true });
        }

        let currentImageIndex = 0; // Start with the default image

        // Safely access constellationImages and limit by the number of constellations the user has unlocked
        const maxImages = Math.min(char.constellations, char.characterID.constellationImages.length); // Ensure we only navigate within unlocked constellations and available images

        // Determine the maximum index for navigation
        const maxIndex = maxImages > 0 ? maxImages : 0;

        const characterEmbed = generateCharacterEmbed(char, currentImageIndex);
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('prev')
                    .setLabel('◀️')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(true), // Initially disable prev button at first image
                new ButtonBuilder()
                    .setCustomId('next')
                    .setLabel('▶️')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(maxIndex === 0 || !char.characterID.constellationImages.length) // Disable next if no constellation images
            );

        const message = await interaction.reply({ embeds: [characterEmbed], components: [row], fetchReply: true });

        const filter = i => i.user.id === interaction.user.id;
        const collector = message.createMessageComponentCollector({ filter, time: 120000 }); // Collector timeout of 2 minutes

        collector.on('collect', async i => {
            if (i.customId === 'prev') {
                try {
                    currentImageIndex = Math.max(currentImageIndex - 1, 0); // Move back an image
                    const prevEmbed = generateCharacterEmbed(char, currentImageIndex);
                    // Update button states
                    row.components[0].setDisabled(currentImageIndex === 0); // Disable prev button if at the first image
                    row.components[1].setDisabled(currentImageIndex >= maxIndex); // Disable next button if at the last image
                    await i.update({ embeds: [prevEmbed], components: [row] });
                } catch (error) {
                    console.error('Error updating to previous image:', error);
                }
            } else if (i.customId === 'next') {
                try {
                    currentImageIndex = Math.min(currentImageIndex + 1, maxIndex); // Move forward an image
                    const nextEmbed = generateCharacterEmbed(char, currentImageIndex);
                    // Update button states
                    row.components[0].setDisabled(currentImageIndex === 0); // Disable prev button if at the first image
                    row.components[1].setDisabled(currentImageIndex >= maxIndex); // Disable next button if at the last image
                    await i.update({ embeds: [nextEmbed], components: [row] });
                } catch (error) {
                    console.error('Error updating to next image:', error);
                }
            }
        });

        collector.on('end', async () => {
            // Disable buttons when collector ends
            await message.edit({ components: [] }); // Remove buttons when collector ends
        });
    },
};



function generateCharacterEmbed(char, imageIndex) {
    const imageUrl = imageIndex === 0 ? char.image : char.characterID.constellationImages[imageIndex - 1];

    const embed = new EmbedBuilder()
        .setTitle(char.name)
        .setDescription(`${char.rarity}\n${char.type}\n${char.anime}`)
        .setImage(imageUrl) // Set image to an empty string if imageUrl is undefined
        .setColor(
            char.type === 'Quasar' ? '#FF0000' : 
            char.type === 'Pulsar' ? '#0000FF' : 
            char.type === 'Supernova' ? '#FFFF00' : 
            '#FFFFFF'
        )
        .setFooter({ text: `Pulled on: ${char.datePulled.toLocaleDateString()} | ${char.credits}` });

    return embed;
}

