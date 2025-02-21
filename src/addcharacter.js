const mongoose = require('mongoose');
const { MONGODB_URI } = require('./config.json'); // Update this path if necessary
const Character = require('./models/character'); // Adjust the path if necessary

const dbName = 'test'; // Your MongoDB database name

async function createCharacters() {
    try {
        // Connect to MongoDB using Mongoose
        await mongoose.connect(MONGODB_URI, { dbName });
        console.log('Connected to MongoDB');

        // Create an array of characters
        const characters = [
            {
                name: 'Rem',
                rarity: '⭐⭐⭐⭐⭐',
                type: 'Pulsar', 
                banner: 'limited',
                imageUrl: 'https://via.placeholder.com/300x420.png?text=Example+Character+1',
                credits: "rem credits"
            },
            {
                name: 'April Hymn',
                rarity: '⭐⭐⭐⭐',
                type: 'Supernova', 
                banner: 'limited',
                imageUrl: 'https://via.placeholder.com/300x420.png?text=Example+Character+2',
                credits: "phym"
            },
            {
                name: 'uwuness',
                rarity: '⭐⭐⭐',
                type: 'Pulsar', 
                banner: 'limited',
                imageUrl: 'https://via.placeholder.com/300x420.png?text=Example+Character+3',
                credits: "lol"
            },
            {
                name: 'Jonathan',
                rarity: '⭐⭐⭐⭐',
                type: 'Quasar', 
                banner: 'limited',
                imageUrl: 'https://via.placeholder.com/300x420.png?text=Example+Character+4',
                credits: "kekw"
            }
        ];

        // Save each character to the database
        for (const characterData of characters) {
            const newCharacter = new Character(characterData);
            await newCharacter.save();
            console.log('Character created:', newCharacter);
        }

    } catch (error) {
        console.error('Error creating character:', error);
    } finally {
        // Close the connection
        await mongoose.disconnect();
        console.log('MongoDB connection closed');
    }
}

// Run the create character function
createCharacters().catch(console.error);
