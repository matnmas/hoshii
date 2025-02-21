const {SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits} = require("discord.js");
const buttonPages = require("../../events/banPagination");

module.exports ={
    category: 'utility',
    data: new SlashCommandBuilder()
        .setName("ban")
        .setDescription("Select a member and ban them.")
        .addUserOption(option =>
            option.setName('target').setDescription('The member to ban').setRequired(true))
        .addStringOption(option =>
            option.setName('reason').setDescription('The reason for banning'))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .setDMPermission(false),
    async execute(interaction){

        const target = interaction.options.getUser('target');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        const member = await interaction.guild.members.fetch(target.id).catch(() => null);

        // Check if the member exists
        if (!member) {
            return await interaction.reply({ content: 'User not found.', ephemeral: true });
        }

        // Check if the member can be banned
        if (!member.bannable) {
            return await interaction.reply({ content: `I cannot ban ${target.username}.`, ephemeral: true });
        }

        // Check if the bot has permission to ban members
        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) {
            return await interaction.reply({ content: 'I do not have permission to ban members.', ephemeral: true });
        }



        const defaultEmbed = new EmbedBuilder()
            .setTitle('Confirmation')
            .setDescription(`Are you sure you want to ban **${target.tag}**\nfor the reason: "${reason}"?`)
            .setColor('#FF0000')
        
        const banSuccess = new EmbedBuilder()
            .setTitle('Member Banned')
            .setDescription(`**${target.tag}** has been banned.`)
            .addFields(
                { name: 'Reason', value: reason, inline: true },
                { name: 'Banned by', value: interaction.user.tag, inline: true }
            )
            .setColor('#FF0000')
        
        const cancelEmbed = new EmbedBuilder()
            .setTitle('Ban Action Cancelled')
            .setDescription(`The ban action for **${target.tag}** has been cancelled.`);

        const pages = [defaultEmbed, banSuccess, cancelEmbed]

        buttonPages(interaction, pages);
    }
}