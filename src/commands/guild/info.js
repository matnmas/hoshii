const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    category: 'utility',
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Get info about a user')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('user')
                .setDescription('user information')
                .addUserOption(option => option.setName('target').setDescription('The user'))),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'user') {
            const user = interaction.options.getUser('target') || interaction.user;
            const member = interaction.guild.members.cache.get(user.id);
            const joined = member.joinedAt.toLocaleString();
            
            const userEmbed = new EmbedBuilder()
                .setTitle(`${user.username}'s Information`)
                .setThumbnail(user.displayAvatarURL())
                .addFields(
                    { name: 'Username', value: user.username, inline: true },
                    { name: 'Tag', value: user.tag, inline: true },
                    { name: 'ID', value: user.id, inline: true },
                    { name: 'Joined at', value: joined} 
                )
                .setColor('Random');

            await interaction.reply({ embeds: [userEmbed] });
        }
    }
};
