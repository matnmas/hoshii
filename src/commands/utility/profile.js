const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const Canvas = require('@napi-rs/canvas');
const { request } = require('undici');
const sharp = require('sharp');
const User = require('../../models/user');
const { GlobalFonts } = require('@napi-rs/canvas');

// Preload Fonts and Background at the module level (once during bot startup)
GlobalFonts.registerFromPath('./Fonts/Montserrat-SemiBold.ttf', 'Montserrat');
GlobalFonts.registerFromPath('./Fonts/Roboto-Thin.ttf', 'Roboto');

module.exports = {
    category: 'utility',
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription('Shows your user profile and your inventory!')
        .setDMPermission(false),
    async execute(interaction) {
        if (!interaction.inGuild) {
            await interaction.reply('You can only run this command in a server.');
            return;
        }

        const user = interaction.options.getUser('target') || interaction.user;

        // Send a quick response before processing
        await interaction.reply('⚝ Stars are being aligned...');

        const backgroundImage = await Canvas.loadImage('https://i.imgur.com/EMxXeDv.png');


        // Parallelize database fetching and avatar loading
        const [userData, avatarResponse] = await Promise.all([
            User.findOne({ userID: user.id }),
            request(interaction.user.displayAvatarURL({ extension: 'jpeg', size: 1024 }))
        ]);

        if (!userData) {
            await interaction.editReply('You need to register through `/explore` first to have a profile.');
            return;
        }

        const avatar = await Canvas.loadImage(await avatarResponse.body.arrayBuffer());

        // Create the canvas
        const canvas = Canvas.createCanvas(700, 200);
        const context = canvas.getContext('2d');

        // Draw background image
        context.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

        // Add a semi-transparent overlay for better text visibility
        context.fillStyle = 'rgba(0, 0, 0, 0.6)';
        context.fillRect(0, 0, canvas.width, canvas.height);

        // Draw avatar
        const avatarX = 46;
        const avatarY = 25;
        const avatarRadius = 75;

        context.save();
        context.beginPath();
        context.arc(avatarX + avatarRadius, avatarY + avatarRadius, avatarRadius, 0, Math.PI * 2, true);
        context.closePath();
        context.clip();
        context.drawImage(avatar, avatarX, avatarY, avatarRadius * 2, avatarRadius * 2);
        context.restore();

        // Text positioning
        const textX = avatarX + avatarRadius * 2 + 55;
        const textY = avatarY + 44;

        // Orbit Level and XP Display
        let orbitLevel = userData.orbitLevel || 0;
        let currentXP = userData.XP || 0;
        let xpRequired = 100;
        if (orbitLevel >= 60) {
            orbitLevel = 60;
            currentXP = 'max'; // Set to '--' for max level
            xpRequired = '--';
        } else {
            // Calculate XP required based on the orbit level
            for (let i = 1; i < orbitLevel; i++) {
                xpRequired += i * 25;
            }
        }
        

        // Draw Orbit Level
        context.font = '20px Montserrat';
        context.fillStyle = '#FFFFFF';
        context.fillText('ORBIT LEVEL:', textX, textY);
        context.font = 'bold 22px Montserrat';
        context.fillStyle = '#FFFFFF';
        context.fillText(`${orbitLevel}`, textX + 150, textY);

        // Draw XP info
        context.font = 'lighter 16px Montserrat';
        context.fillStyle = '#FFFFFF';
        context.fillText(`XP: ${currentXP} / ${xpRequired}`, textX, textY + 35);

        // Progress Bar
        const progressBarX = textX;
        const progressBarY = textY + 60;
        const progressBarWidth = 400;
        const progressBarHeight = 20;
        const progress = Math.min(currentXP / xpRequired, 1);

        // Draw progress bar background
        context.fillStyle = '#555555';
        context.beginPath();
        context.roundRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight, 10);
        context.fill();

        // Draw progress bar foreground
        context.fillStyle = '#FFFFFF';
        context.beginPath();
        context.roundRect(progressBarX, progressBarY, progressBarWidth * progress, progressBarHeight, 10);
        context.fill();

        // Convert canvas to buffer and process with sharp
        const canvasBuffer = await canvas.encode('png');
        const processedImageBuffer = await sharp(canvasBuffer)
            .resize({ width: 700 })
            .sharpen()
            .toBuffer();

        const attachment = new AttachmentBuilder(processedImageBuffer, { name: 'profile-image.png' });

        const bio = userData.bio || 'Default bio, please set new one (/setBio)';

        // Cooldown calculations
        const now = new Date();
        let dailyCooldown = '☑️';
        if (userData.lastDaily && (now - userData.lastDaily < 24 * 60 * 60 * 1000)) {
            const nextDaily = new Date(userData.lastDaily.getTime() + 24 * 60 * 60 * 1000);
            const timeLeft = nextDaily - now;
            const hours = Math.floor(timeLeft / (1000 * 60 * 60));
            const minutes = Math.ceil((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            dailyCooldown = `${hours}h ${minutes}m`;
        }

        const dropInterval = 10 * 60 * 1000;
        let spaceCooldown = '☑️';
        if (userData.lastDropTime && (now - userData.lastDropTime < dropInterval)) {
            const nextSpace = new Date(userData.lastDropTime.getTime() + dropInterval);
            const timeLeft = nextSpace - now;
            const minutes = Math.floor(timeLeft / (1000 * 60));
            const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
            spaceCooldown = `${minutes}m ${seconds}s`;
        }

        // Build the profile embed
        const profileEmbed = new EmbedBuilder()
            .setTitle('⚝ | ' + user.username)
            .setColor('White')
            .setDescription(bio)
            .setImage('attachment://profile-image.png')
            .addFields({
                name: '**Inventory**',
                value: `⭐  \`${userData.stars.toString().padEnd(5)}\` | ☄️  \`${userData.comet.toString().padEnd(5)}\` | 🌑  \`${userData.asteroid.toString().padEnd(5)}\` | ⚫  \`${userData.void.toString().padEnd(5)}\`\n🌟  \`${userData.starlight.toString().padEnd(5)}\` | 🌠  \`${userData.shootingStar.toString().padEnd(5)}\` | 🌙  \`${userData.crescent.toString().padEnd(5)}\` | ✨  \`${userData.exaltedStarlight.toString().padEnd(5)}\`\n`
            }, {
                name: 'Cooldowns',
                value: `\`DAILY\` | ${dailyCooldown.toString().padEnd(5)}\n\`SPACE\` | ${spaceCooldown.toString().padEnd(5)}`
            })
            .setFooter({ text: 'UID: ' + user.id });

        // Edit the initial reply with the embed and image attachment
        await interaction.editReply({ content: '', embeds: [profileEmbed], files: [attachment] });
    },
};
