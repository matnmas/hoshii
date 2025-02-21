const { SlashCommandBuilder } = require('discord.js');

// Random GIF links for each category (you can replace these with your own)
const gifs = {
    gif_funny: [
        'https://media.giphy.com/media/l0HlQ7LRal8lK4XfK/giphy.gif',
        'https://media.giphy.com/media/3o7btOhhEFeaNwDpsQ/giphy.gif',
        'https://media.giphy.com/media/l4HnKwiJJaJQB04Zq/giphy.gif',
    ],
    gif_meme: [
        'https://media.giphy.com/media/2A02BHjAVvNRe/giphy.gif',
        'https://media.giphy.com/media/xT9IgDEI1iZyb2wqo8/giphy.gif',
        'https://media.giphy.com/media/3o7TKtdPDfMd9pTLkA/giphy.gif',
    ],
    gif_movie: [
        'https://media.giphy.com/media/26u4h0wAffsR3qRaU/giphy.gif',
        'https://media.giphy.com/media/l2JehL5gE0OxdwQTC/giphy.gif',
        'https://media.giphy.com/media/dJYoOVAWf2QkU/giphy.gif',
    ],
};

module.exports = {
    category: 'utility',
    data: new SlashCommandBuilder()
        .setName('gif')
        .setDescription('Sends a random gif!')
        .addStringOption(option =>
            option.setName('category')
                .setDescription('The gif category')
                .setRequired(true)
                .addChoices(
                    { name: 'Funny', value: 'gif_funny' },
                    { name: 'Meme', value: 'gif_meme' },
                    { name: 'Movie', value: 'gif_movie' },
                )),

    async execute(interaction) {
        // Get the category chosen by the user
        const category = interaction.options.getString('category');

        // Get a random GIF from the selected category
        const selectedGifs = gifs[category];
        const randomGif = selectedGifs[Math.floor(Math.random() * selectedGifs.length)];

        // Send the random GIF
        await interaction.reply(randomGif);
    },
};
