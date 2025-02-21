const { SlashCommandBuilder, ChannelType, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    category: 'guild',
    data: new SlashCommandBuilder()
        .setName('echo')
        .setDescription('Replies with your input!')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option =>
            option.setName('input')
                .setDescription('The input to echo back')
                .setRequired(true))
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel to echo into')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText)) // Only works if addChannelTypes is valid in your version
        .addBooleanOption(option =>
            option.setName('embed')
                .setDescription('Whether or not the echo should be embedded')),
    async execute(interaction) {
        const input = interaction.options.getString("input");
        const channel = interaction.options.getChannel('channel');
        const embed = interaction.options.getBoolean('embed');

        if (embed) {
            // Create an embedded message
            const embedMessage = new EmbedBuilder()
                .setDescription(input)
                .setColor('#0099ff'); // Set the color of the embed

            await channel.send({ embeds: [embedMessage] });
            await interaction.reply({ content: `Embedded message sent to ${channel}`, ephemeral: true });
        } else {
            // Send a plain text message
            await channel.send(input);
            await interaction.reply({ content: `Message sent to ${channel}`, ephemeral: true });
        }
    }
};
