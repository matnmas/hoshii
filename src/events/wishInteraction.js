const { Events, EmbedBuilder } = require('discord.js');
const User = require('../models/user'); // Adjust the path as necessary
const Character = require('../models/character'); // Adjust the path as necessary

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (!interaction.isButton()) return;

        // Fetch the user from the database
        let user = await User.findOne({ userID: interaction.user.id });
        if (!user) {
            return interaction.reply({ content: 'User not found in the database.', ephemeral: true });
        }

        // Parse the customId
        // Expected format: 'pull:<bannerType>:<currencyType>:<pullCount>'
        const [action, bannerType, currencyType, pullCountStr] = interaction.customId.split(':');
        const pullCount = parseInt(pullCountStr, 10);

        if (action !== 'pull') return; // Not a pull action

        let cost = 0;
        let currencyField = '';

        // Determine cost and currency field based on currencyType
        switch (currencyType) {
            case 'comet':
                currencyField = 'comet';
                cost = pullCount;
                break;
            case 'crescent':
                currencyField = 'crescent';
                cost = pullCount;
                break;
            case 'star':
                currencyField = 'stars';
                cost = pullCount * 160;
                break;
            default:
                return interaction.reply({ content: 'Invalid currency type.', ephemeral: true });
        }

        // Check if the user has enough currency
        if (user[currencyField] < cost) {
            return interaction.reply({ content: `Not enough ${currencyType === 'stars' ? 'stars' : currencyType}.`, ephemeral: true });
        }

        // Deduct the cost
        user[currencyField] -= cost;

        // Update total pulls
        user.totalPulls += pullCount;

        await user.save(); // Save updated user currency

        // Show pulling animation embed
        const loadingEmbed = new EmbedBuilder()
            .setTitle('Pulling...')
            .setDescription('Please wait while we pull your characters!')
            .setImage('https://via.placeholder.com/900x500.png/000000/FFFFFF?text=Pulling...')
            .setColor('#000000');

        // Send the loading embed
        const reply = await interaction.reply({ embeds: [loadingEmbed], fetchReply: true });

        // Call the gacha function to determine pulls
        const results = await gachaPull(user, pullCount, bannerType);

        // Prepare summary for the end of pulls
        let summaryEmbed = new EmbedBuilder()
            .setTitle('Pull Summary')
            .setColor('#FFFFFF');

        let summaryDescriptions = []; // Collecting summary lines

        for (let i = 0; i < results.length; i++) {
            const charEmbed = results[i].embed; // Character embed
            const summary = results[i].summary; // Summary string
            await new Promise(resolve => setTimeout(resolve, 2000)); // Fixed delay of 2 seconds
            await reply.edit({ embeds: [charEmbed] }); // Edit the previous embed to show the result
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Collect summary descriptions
            summaryDescriptions.push(summary);

            // Show the pulling animation for each pull
            if (i < results.length - 1) {
                loadingEmbed.setDescription('Pulling next character...');
                await reply.edit({ embeds: [loadingEmbed] });
            }
        }

        // Send the summary after all pulls
        if (pullCount > 1) {
            summaryEmbed.setDescription(summaryDescriptions.join('\n'));
            await interaction.followUp({ embeds: [summaryEmbed] });
        }
    },
};

// Gacha logic fetching characters from the database
async function gachaPull(user, pulls, bannerType) {
    let results = [];
    let guaranteedLimitedNext5Star = false; // To track if next 5-star is guaranteed limited
    let guaranteedStandardNext5Star = false; // To track if next 5-star is guaranteed standard

    for (let i = 0; i < pulls; i++) {
        let roll = Math.random() * 100;
        let rarity;
        let selectedBanner = 'standard'; // Default banner for standard pulls
        console.log(`Pull ${i + 1}/${pulls} | Current pity pulls: ${user.pityPulls}`);

        if (bannerType === 'limited') {
            // Apply pity system first
            // Apply soft pity
            if (user.pityPulls >= 70 && user.pityPulls < 80) {
                roll -= (user.pityPulls - 69) * 5; // Increase chances at soft pity
                if (roll < 0) roll = 0;
            }

            // Apply hard pity
            if (user.pityPulls >= 80) {
                roll = 0; // Guaranteed 5-star
            }

            // On the 10th pull, ensure at least a 4-star or higher
            if ((user.totalPulls + i) % 10 === 9) {
              
                // Retain original logic: generate a roll between 0 and 4
                roll = Math.random() * 4; // 0 <= roll < 4
                console.log(`Forced Roll on 10th Pull: New Roll: ${roll}`);
            }

            // Determine rarity based on the roll
            if (roll < 0.6) {
                rarity = '⭐⭐⭐⭐⭐'; // 5-star
            } else if (roll < 5.1) {
                rarity = '⭐⭐⭐⭐'; // 4-star
            } else {
                rarity = '⭐⭐⭐'; // 3-star
            }

            // Handle 5-star guarantees
            if (rarity === '⭐⭐⭐⭐⭐') {
                if (guaranteedLimitedNext5Star) {
                    selectedBanner = 'limited';
                    guaranteedLimitedNext5Star = false;
                } else if (guaranteedStandardNext5Star) {
                    selectedBanner = 'standard';
                    guaranteedStandardNext5Star = false;
                } else {
                    // 50/50 chance
                    selectedBanner = Math.random() < 0.5 ? 'standard' : 'limited';
                    if (selectedBanner === 'standard') {
                        guaranteedLimitedNext5Star = true; // Next 5-star is guaranteed limited
                    } else {
                        guaranteedStandardNext5Star = true; // Next 5-star is guaranteed standard
                    }
                }
            }

        } else {
            // Standard banner logic with pity system
            // Apply soft pity
            if (user.pityPulls >= 70 && user.pityPulls < 80) {
                roll -= (user.pityPulls - 69) * 5; // Increase chances at soft pity
                if (roll < 0) roll = 0;
            }

            // Apply hard pity
            if (user.pityPulls >= 80) {
                roll = 0; // Guaranteed 5-star
            }

            // On the 10th pull, ensure at least a 4-star or higher
            if ((user.totalPulls + i) % 10 === 9) {
                
                // Retain original logic: generate a roll between 0 and 4
                roll = Math.random() * 4; // 0 <= roll < 4
                console.log(`Forced Roll on 10th Pull: New Roll: ${roll}`);
                
            }

            // Determine rarity based on the roll
            if (roll < 0.6) {
                rarity = '⭐⭐⭐⭐⭐'; // 5-star
            } else if (roll < 5.1) {
                rarity = '⭐⭐⭐⭐'; // 4-star
            } else {
                rarity = '⭐⭐⭐'; // 3-star
            }
        }

        // Increment pity pulls after determining the rarity
        user.pityPulls++;

        // Reset or update pity pulls based on rarity
        if (rarity === '⭐⭐⭐⭐⭐') {
            user.pityPulls = 0; // Reset pity after pulling a 5-star
        }

        // Fetch a character based on rarity and banner
        let character;

        if (bannerType === 'limited') {
            // Handle pulling for limited banner
            if (rarity === '⭐⭐⭐⭐⭐') {
                // If pulling a 5-star in limited banner, select from appropriate banner
                character = await getCharacterByRarityAndBanner(rarity, selectedBanner);
            } else if (rarity === '⭐⭐⭐⭐') {
                // For 4-stars in limited banner, slightly favor limited characters
                const limitedFourStar = await getCharacterByRarityAndBanner(rarity, 'limited');
                const standardFourStar = await getCharacterByRarityAndBanner(rarity, 'standard');
        
                // 60% limited, 40% standard
                character = Math.random() < 0.6 ? limitedFourStar : standardFourStar;
            } else {
                // For 3-star characters in limited banner
                const limitedThreeStar = await getCharacterByRarityAndBanner('⭐⭐⭐', 'limited');
                const standardThreeStar = await getCharacterByRarityAndBanner('⭐⭐⭐', 'standard');
        
                // You can decide how you want to weight the chances
                character = Math.random() < 0.5 ? limitedThreeStar : standardThreeStar; // 50/50 chance for example
            }
        } else {
            // Standard banner or other rarities
            character = await getCharacterByRarityAndBanner(rarity, 'standard');
        }
        

        if (character) {
            const char = character;
            let summary = `${char.name}`; // Remove rarity from summary

            // Check for duplicates and handle rewards
            const existing = user.pulledCharacters.find(pc => pc.characterID.equals(char._id));
            let starlight = 0; // Initialize starlight for duplicates

            if (existing) {
                // Update constellations and starlight for duplicates
                existing.constellations = Math.min(existing.constellations + 1, 6);
                if (rarity === '⭐⭐⭐') {
                    starlight = 15; // Add starlight for 3-star duplicates
                    summary += ` | ${starlight} 🌟`; // Regular starlight for 3-star duplicates
                } else if (rarity === '⭐⭐⭐⭐') {
                    starlight = 2; // Exalted starlight for 4-star duplicates
                    summary += ` | ${starlight} ✨`; // Exalted starlight for 4-star duplicates
                } else if (rarity === '⭐⭐⭐⭐⭐') {
                    starlight = 10; // Exalted starlight for 5-star duplicates
                    summary += ` | ${starlight} ✨`; // Exalted starlight for 5-star duplicates
                }
                user.exaltedStarlight += (rarity === '⭐⭐⭐⭐' || rarity === '⭐⭐⭐⭐⭐') ? starlight : 0; // Update exalted starlight
                user.starlight += (rarity === '⭐⭐⭐') ? starlight : 0; // Update regular starlight
            } else {
                user.pulledCharacters.push({
                    characterID: char._id,
                    name: char.name,
                    rarity: rarity,
                    type: char.type,
                    constellations: 0,
                    image: char.imageUrl,
                    credits: char.credits,
                    anime: char.anime,
                    datePulled: new Date() // Record the pull date
                });
                summary += ` | \`NEW\``; // Mark as new
            }

            // Create an embed for the pulled character
            const characterEmbed = new EmbedBuilder()
                .setTitle(char.name)
                .setDescription(`${rarity}\n${char.type}\`${char.anime}\`${starlight > 0 ? `\nx${starlight} ${rarity === '⭐⭐⭐⭐' ? '✨' : '🌟'}` : ''}`) // Use ✨ for 4-star and 🌟 for 3-star starlight
                .setImage(char.imageUrl || 'https://via.placeholder.com/300x420.png/000000/FFFFFF?text=Character+Image')
                .setColor('#FFFFFF')
                .setFooter({ text: char.credits });

            results.push({ embed: characterEmbed, summary: summary, rarity: rarity });

            await user.save(); // Save updated user with new pulled character
        } else {
            const fallbackEmbed = new EmbedBuilder()
                .setTitle('Error')
                .setDescription('Character not found.')
                .setColor('#FF0000');
            results.push({ embed: fallbackEmbed, summary: 'Character not found.', rarity: 'Error' });
        }
    }

    return results;
}

// Helper function to fetch a character based on rarity and banner
async function getCharacterByRarityAndBanner(rarity, banner) {
    let matchCriteria = { rarity };

    if (banner) {
        matchCriteria.banner = banner;
    }

    const character = await Character.aggregate([
        { $match: matchCriteria },
        { $sample: { size: 1 } }
    ]);

    return character.length > 0 ? character[0] : null;
}
