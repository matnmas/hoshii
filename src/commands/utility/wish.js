const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder } = require('discord.js');
const User = require('../../models/user'); // Assuming you have your User schema in the models folder
const mongoose = require('mongoose');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('wish')
        .setDescription('Gacha for characters you want!')
        .addStringOption(option => 
            option.setName('banner')
                .setDescription('Select Banner Type')
                .setRequired(true)
                .addChoices(
                    { name: 'Standard', value: 'standard' },
                    { name: 'Limited', value: 'limited' } // Added Limited banner option
                )),
    async execute(interaction) {
        // Fetch the user from the database
        let user = await User.findOne({ userID: interaction.user.id });
        if (!user) {
            return interaction.reply('You need to register through `/explore` first to make a wish.');
        }

        // Get the user's choice (standard or limited)
        const bannerType = interaction.options.getString('banner');

        // Set up title, image, and rates for the selected banner
        let title = '';
        let image = '';
        let footerText = '';
        let row = new ActionRowBuilder();

        if (bannerType === 'standard') {
            title = 'Standard Banner';
            image = 'https://via.placeholder.com/900x500.png?text=Gacha+Standard+Banner';
            footerText = '5 Star - 0.6% | 4 Star - 5.1% | 3 Star - 94.3%';

            // Buttons for Standard Banner (using comets ☄️)
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId('pull:standard:comet:1')
                    .setLabel('☄️ x 1')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('pull:standard:comet:10')
                    .setLabel('☄️ x 10')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('pull:standard:star:1')
                    .setLabel('⭐ x 160')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('pull:standard:star:10')
                    .setLabel('⭐ x 1600')
                    .setStyle(ButtonStyle.Secondary)
            );

        } else if (bannerType === 'limited') {
            title = 'Limited Banner';
            image = 'https://via.placeholder.com/900x500.png?text=Gacha+Limited+Banner';
            footerText = '5 Star - 0.6% | 4 Star - 5.1% | 3 Star - 94.3%';

            // Buttons for Limited Banner (using crescents 🌙)
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId('pull:limited:crescent:1')
                    .setLabel('🌙 x 1')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('pull:limited:crescent:10')
                    .setLabel('🌙 x 10')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('pull:limited:star:1')
                    .setLabel('⭐ x 160')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('pull:limited:star:10')
                    .setLabel('⭐ x 1600')
                    .setStyle(ButtonStyle.Secondary)
            );
        }

        // Create the embed with the dynamic banner content
        const wishEmbed = new EmbedBuilder()
            .setTitle(title)
            .setImage(image)
            .setColor('#FFFFFF')
            .setFooter({ text: footerText });

        // Send the embed with buttons
        await interaction.reply({ embeds: [wishEmbed], components: [row] });
    },
};
