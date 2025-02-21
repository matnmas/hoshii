const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const User = require('../../models/user');

module.exports = {
    category: 'utility',
    data: new SlashCommandBuilder()
        .setName('daily')
        .setDescription('Claim your daily reward!')
        .setDMPermission(false),
    async execute(interaction) {
        if (!interaction.guild) {
            return interaction.reply('This command can only be used in a server.');
        }

        const userId = interaction.user.id;
        const now = new Date();
        const dayOfWeek = now.getDay();
        let reward = 0;
        let rewardType = '';
        let rewardEmoji = '';

        // Determine reward based on the day of the week
        switch (dayOfWeek) {
            case 0: reward = 100; rewardType = 'stars'; rewardEmoji = '⭐'; break;
            case 1: reward = 1; rewardType = 'shootingStar'; rewardEmoji = '🌠'; break;
            case 2: reward = 5; rewardType = 'asteroid'; rewardEmoji = '🌑'; break;
            case 3: reward = 10; rewardType = 'void'; rewardEmoji = '⚫'; break;
            case 4: reward = 1; rewardType = 'shootingStar'; rewardEmoji = '🌠'; break;
            case 5: reward = 5; rewardType = 'asteroid'; rewardEmoji = '🌑'; break;
            case 6: reward = 200; rewardType = 'stars'; rewardEmoji = '⭐'; break;
        }

        // Check if user is registered
        let user = await User.findOne({ userID: userId });
        if (!user) {
            return interaction.reply('You need to register through `/explore` first to claim your daily reward.');
        }

       const dailyCooldown = 24 * 60 * 60 * 1000;
       // Check if the user is on cooldown
       const lastDaily = user.lastDaily ? user.lastDaily.getTime() : 0;
       const timeSinceLastClaim = now.getTime() - lastDaily;

       if (timeSinceLastClaim < dailyCooldown) {
           // Calculate time left
           const timeLeft = dailyCooldown - timeSinceLastClaim;
           const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
           const minutesLeft = Math.floor((timeLeft / (1000 * 60)) % 60);
           const secondsLeft = Math.floor((timeLeft / 1000) % 60);

           // Cooldown embed
           const cooldownEmbed = new EmbedBuilder()
               .setColor('#000000')
               .setTitle('Cooldown Active!')
               .setDescription('Error$%^- daily claimed already--')
               .addFields({ name: 'Countdown', value: `**${hoursLeft}h ${minutesLeft}m ${secondsLeft}s** left till execution.` });

           return interaction.reply({ embeds: [cooldownEmbed]});
       }

        // Create a button to claim the daily reward
        const claimButton = new ButtonBuilder()
            .setCustomId('claim_daily')
            .setLabel('Spacekey')
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(claimButton);

        // Initial embed message with the claim button
        const initialEmbed = new EmbedBuilder()
            .setTitle('Claim your daily reward ✨')
            .setDescription(`Welcome, <@${interaction.user.id}>! Tap the Spacekey🗝️ to claim your reward.`)
            .setColor('White')
            .setTimestamp();

        await interaction.reply({ embeds: [initialEmbed], components: [row] });

        // Button collector for claim
        const filter = i => i.customId === 'claim_daily' && i.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 30000 });

        collector.on('collect', async i => {
            if (i.replied || i.deferred) return; // Prevent handling if already replied or deferred

            try {
                // Update user data with the reward
                let user = await User.findOne({ userID: userId });
                if (user.lastDaily && user.lastDaily.toDateString() === now.toDateString()) {
                    return i.reply({ content: 'You have already claimed your daily reward today!', ephemeral: true });
                }

                if (rewardType !== 'none') {
                    user[rewardType] = (user[rewardType] || 0) + reward;
                }
                user.lastDaily = now;
                await user.save();

                // Map reward types to their display names
                const rewardTypeMap = {
                    stars: 'Stars',
                    shootingStar: 'Shooting Star',
                    asteroid: 'Asteroid',
                    void: 'Void'
                };

                // Embed to show that the reward has been claimed
                const rewardEmbed = new EmbedBuilder()
                    .setTitle(`${i.user.username} claimed their daily reward 🌌`)
                    .setDescription(`Congrats ${i.user.username}! You've received \` ${reward} \` ${rewardTypeMap[rewardType]} ${rewardEmoji}.`)
                    .setThumbnail(i.user.displayAvatarURL())
                    .setColor('White')
                    .setFooter({ text: `Claim again tomorrow!` })
                    .setTimestamp();

                // Update the message with the reward information
                await i.update({ content: null, components: [], embeds: [rewardEmbed] });
            } catch (error) {
                console.error('Error handling button interaction:', error);
                if (!i.replied) {
                    await i.reply({ content: 'There was an error claiming your daily reward.', ephemeral: true });
                }
            }
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                interaction.editReply({ content: 'You took too long to claim your reward!', components: [] });
            }
        });
    },
};
