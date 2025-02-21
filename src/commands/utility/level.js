const { SlashCommandBuilder, AttachmentBuilder} = require('discord.js');
const Level = require('../../models/serverLevel');
const expLevel = require('../../utils/expLevel');
const { category } = require('./ban');
const sharp = require('sharp');

module.exports = {
    category: 'utility',
    data: new SlashCommandBuilder()
        .setName('level')
        .setDescription("Shows your level or someone else's")
        .setDMPermission(false)
        .addMentionableOption(option => 
            option.setName('user')
                .setDescription('Check level of a specific user')
                .setRequired(false)),
    async execute(interaction) {
        if (!interaction.inGuild) {
            await interaction.reply('You can only run this command in a server.');
            return;
        }
        await interaction.deferReply();

        const mentionUserID = interaction.options.getUser('user')?.id;
        const targetUserID = mentionUserID || interaction.user.id;
        const targetUserObject = await interaction.guild.members.fetch(targetUserID);

        const fetchedLevel = await Level.findOne({
            userId: targetUserID,
            guildId: interaction.guild.id,
        });

        if (!fetchedLevel) {
            await interaction.editReply(
                mentionUserID ? `${targetUserObject.user.tag} has no levels yet or has not been chatting yet 😔.`
                : "Just chat a little more so you will have a level in this server. 😎"
            );
            return;
        }

        let allLevels = await Level.find({ guildId: interaction.guild.id }).select('-_id userId level exp');

        allLevels.sort((x, y) => {
            if (x.level === y.level) {
                return y.exp - x.exp;
            } else {
                return y.level - x.level;
            }
        });

        let currentRank = allLevels.findIndex((lvl) => lvl.userId === targetUserID) + 1;

        const {Font, RankCardBuilder} = require('canvacord');
        Font.loadDefault();

        const userStatus = targetUserObject.presence ? targetUserObject.presence.status : 'offline';
        // Create the rank card
        const rank = new RankCardBuilder()
            .setAvatar(targetUserObject.user.displayAvatarURL({ size: 512 }))
            .setRank(currentRank)
            .setLevel(fetchedLevel.level)
            .setCurrentXP(fetchedLevel.exp)
            .setRequiredXP(expLevel(fetchedLevel.level))
            .setStatus(userStatus)
            .setUsername(targetUserObject.user.username)
            .setBackground('https://i.imgur.com/84LQlUT.png')
            


        const imageBuffer = await rank.build({ format: 'png' });

        // Process the image with sharp
        const processedImageBuffer = await sharp(imageBuffer)
            .resize({ width: 1920 }) 
            .sharpen()  // Apply sharpening to enhance details
            .toBuffer();
        
        const attachment = new AttachmentBuilder(processedImageBuffer, { name: 'rank_card.png' });

        await interaction.editReply({ files: [attachment] });
    }
};
