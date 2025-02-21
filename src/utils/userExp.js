const { Client, Message} = require('discord.js');
const Level = require('../models/serverLevel');
const calculateExp = require('../utils/expLevel');
const cooldowns = new Set();


function getRandomExp(min, max){
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
/**
 * 
 * @param {Client} client 
 * @param {Message} message 
 */

module.exports = async (client, message)=>{
    if(!message.inGuild() || message.author.bot || cooldowns.has(message.author.id)) return;

    const expToGive = getRandomExp(5, 15);
    const query = {
        userId: message.author.id,
        guildId: message.guild.id,
    };

    try {
        const level = await Level.findOne(query)

        if (level){
            level.exp += expToGive;

            if (level.exp > calculateExp(level.level)){
                level.exp = 0;
                level.level += 1;

                message.channel.send(`${message.member} you have leveled up to **level ${level.level}**.`);
            }

            await level.save().catch((e) => {
                console.log(`Error saving updated level ${e}`);
                return;
            })
            cooldowns.add(message.author.id);
            setTimeout(() => {
                cooldowns.delete(message.author.id);
            }, 60000);
        }

        //if(!level)
        else{
            //create new level
            const newLevel  = new Level({
                userId: message.author.id,
                guildId: message.guild.id,
                exp: expToGive,
            });

            await newLevel.save();
            cooldowns.add(message.author.id);
            setTimeout(() => {
                cooldowns.delete(message.author.id);
            }, 60000);
        }
    } catch (error) {
        console.log(`Error in giving experience points (exp): ${[error]}`)
    }
}