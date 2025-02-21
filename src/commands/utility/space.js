const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const User = require('../../models/user');

const dropInterval = 1 * 60 * 1000; // 10 minutes
const baseStarRange = [5, 10]; // Base stars per drop
const baseAsteroidChance = 0.45; // 45% chance for asteroids
const baseVoidChance = 0.45; // 45% chance for voids

const emojis = ['⭐', '🌌', '🪐', '💫', '🚀', '🌠', '🚩', '✅', '🪨', '🌈', '🌊', '🌀', '🐧', '🗿']; // Possible reaction emojis

const rewardLevels = {
    5: { comet: 5, stars: 200 },
    15: { comet: 5, stars: 400 },
    25: { comet: 10, shootingStar: 10 },
    35: { comet: 15, shootingStar: 15 },
    45: { comet: 15, stars: 800 },
    55: { comet: 10, crescent: 10, stars: 1000 }
};

const levelUpMessages = [
    'You are getting closer to the stars!',
    'You have ascended into the orbit!',
    'You have reached the celestials!',
    'You have further explored the galaxy!',
    'You reached another level of constellations!',
    'You have awakened your journey into the stellar!'
];

module.exports = {
    category: 'utility',
    data: new SlashCommandBuilder()
        .setName('space')
        .setDescription('Claim stars every 10 minutes!')
        .setDMPermission(false),
    async execute(interaction) {
        const userId = interaction.user.id;

        // Ensure the user has registered
        let user = await User.findOne({ userID: userId }).exec();
        if (!user) {
            return interaction.reply('You need to register through `/explore` first to claim your stars.');
        }

        const currentTime = Date.now();

        // Check last drop time
        if (user.lastDropTime && currentTime - user.lastDropTime < dropInterval) {
            const timeLeft = dropInterval - (currentTime - user.lastDropTime);
            const minutesLeft = Math.floor((timeLeft / 1000 / 60) % 60);
            const secondsLeft = Math.floor((timeLeft / 1000) % 60);

            const cooldownEmbed = new EmbedBuilder()
                .setColor('#000000')
                .setTitle('Cooldown Active!')
                .setDescription(`You've disrupted the time continuum!`)
                .addFields({ name: 'Countdown', value: `**${minutesLeft}m ${secondsLeft}s** till execution!` });

            return interaction.reply({ embeds: [cooldownEmbed] });
        }

        user.lastDropTime = currentTime;

        const requiredEmoji = emojis[Math.floor(Math.random() * emojis.length)];

        const dropEmbed = new EmbedBuilder()
            .setColor('White')
            .setTitle('🌌 Star Drop!')
            .setDescription(`React with **${requiredEmoji}** to claim your stars!`);

        const msg = await interaction.reply({ embeds: [dropEmbed], fetchReply: true });

        const filter = (reaction, user) => reaction.emoji.name === requiredEmoji && !user.bot;

        const collector = msg.createReactionCollector({ filter, time: 30000 });

        collector.on('collect', async (reaction, user) => {
            let userDoc = await User.findOne({ userID: interaction.user.id }).exec();
            if (!userDoc) {
                console.error('User not found during reaction collection!');
                return;
            }

            // Initialize user fields if not already set
            userDoc.stars = userDoc.stars || 0;
            userDoc.XP = userDoc.XP || 0;
            userDoc.asteroid = userDoc.asteroid || 0;
            userDoc.void = userDoc.void || 0;
            userDoc.orbitLevel = userDoc.orbitLevel || 0;

            // Calculate stars based on the user's level
            let stars;
            if (userDoc.orbitLevel >= 60) {
                stars = Math.floor(Math.random() * (15 - 10 + 1)) + 10; // Level 60+ gets 10-15 stars
            } else if (userDoc.orbitLevel >= 50) {
                stars = Math.floor(Math.random() * (13 - 7 + 1)) + 7; // Level 50-59 gets 7-13 stars
            } else {
                stars = Math.floor(Math.random() * (baseStarRange[1] - baseStarRange[0] + 1)) + baseStarRange[0];
            }
            userDoc.stars += stars;

            // Calculate experience points
            const expGained = Math.floor(Math.random() * 11) + 45;
            userDoc.XP += expGained;

            // Level up logic with max level cap at 60
            let level = userDoc.orbitLevel;
            let xpRequired = 100; // Initial XP requirement for level 1
            for (let i = 1; i < level; i++) {
                xpRequired += i * 25; // Increment XP requirement for each level
            }

            while (userDoc.XP >= xpRequired && userDoc.orbitLevel < 60) {
                userDoc.XP -= xpRequired;  // Subtract the XP needed for the current level
                userDoc.orbitLevel += 1;   // Level up
                xpRequired = 100;          // Reset xpRequired for the next level
                for (let i = 1; i < userDoc.orbitLevel; i++) {
                    xpRequired += i * 25;  // Recalculate XP requirement for the next level
                }

                // Check if user reached a milestone level and reward them
                if (rewardLevels[userDoc.orbitLevel]) {
                    const rewards = rewardLevels[userDoc.orbitLevel];
                    let rewardMessage = `\nYou have received the following rewards:`;

                    // Add rewards to user and build reward message
                    if (rewards.comet) {
                        userDoc.comet = (userDoc.comet || 0) + rewards.comet;
                        rewardMessage += ` **${rewards.comet}** ☄️`;
                    }
                    if (rewards.stars) {
                        userDoc.stars += rewards.stars;
                        rewardMessage += `, **${rewards.stars}** ⭐`;
                    }
                    if (rewards.shootingStar) {
                        userDoc.shootingStar = (userDoc.shootingStar || 0) + rewards.shootingStar;
                        rewardMessage += `, **${rewards.shootingStar}** 🌠`;
                    }
                    if (rewards.crescent) {
                        userDoc.crescent = (userDoc.crescent || 0) + rewards.crescent;
                        rewardMessage += `, **${rewards.crescent}** 🌙`;
                    }

                    // Send the level-up reward message
                    const levelUpMessage = levelUpMessages[Math.floor(Math.random() * levelUpMessages.length)];
                    await interaction.followUp(`<@${interaction.user.id}>, you've leveled up to **Orbit Level ${userDoc.orbitLevel}**! ${rewardMessage}\n${levelUpMessage}`);
                }
            }

            // Save user data
            try {
                await userDoc.save();
                const claimEmbed = new EmbedBuilder()
                    .setColor('White')
                    .setTitle('Claim Successful!')
                    .setDescription(`You've claimed **${stars}** ⭐ (${userDoc.stars} total)`)
                    .addFields(
                        { name: `Orbit Level (${userDoc.orbitLevel})`, value: `You gained **${expGained}** EXP! (${userDoc.XP}/${xpRequired})` }
                    );

                await interaction.followUp({ embeds: [claimEmbed] });
            } catch (err) {
                console.error('Error saving user:', err);
            }

            collector.stop(); // Stop collecting after a successful claim
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                interaction.followUp("Time's up! No stars claimed.");
            }
        });

        // Save the user data with the updated drop time
        try {
            await user.save();
        } catch (err) {
            console.error('Error updating lastDropTime:', err);
        }
    },
};
