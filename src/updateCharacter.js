const mongoose = require('mongoose');
const { MONGODB_URI } = require('./config.json'); // Update this path if necessary

const dbName = 'test'; // Your MongoDB database name

// Define the Character schema (if necessary, else remove this part)
const characterSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true }, // Character name
    rarity: { type: String, required: true }, // 5-star, 4-star, etc.
    type: { type: String, required: true }, // to be determined what kind
    banner: { type: String, required: true }, // 'standard', 'limited', etc.
    imageUrl: { type: String }, // URL for the character's default image
    constellationImages: { type: [String], default: [] }, // Array of images for each constellation level
    credits: { type: String },
    anime: { type: String }
});

const Character = mongoose.model('Character', characterSchema);

async function updateRemCharacter() {
    try {
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI, { dbName });
        console.log('Connected to MongoDB');

        // Check if Rem exists
        const character = await Character.findOne({ name: 'Rem' });

        if (!character) {
            console.log('Character not found.');
            return; // Exit if the character does not exist
        }

        // Define the update for Rem character (only update constellationImages)
        const updateData = {
            constellationImages: [
                'https://via.placeholder.com/300x420.png?text=Rem+Constellation+1',
                'https://via.placeholder.com/300x420.png?text=Rem+Constellation+2',
                'https://via.placeholder.com/300x420.png?text=Rem+Constellation+3',
                'https://via.placeholder.com/300x420.png?text=Rem+Constellation+4',
                'https://via.placeholder.com/300x420.png?text=Rem+Constellation+5',
                'https://via.placeholder.com/300x420.png?text=Rem+Constellation+6'
            ]
        };

        // Update the Rem character in the database
        const updateResult = await Character.updateOne(
            { name: 'Rem' },
            { $set: updateData }
        );

        console.log('Update operation result:', updateResult);

    } catch (error) {
        console.error('Error updating character:', error);
    } finally {
        // Close the connection
        await mongoose.disconnect();
        console.log('MongoDB connection closed');
    }
}

// Run the update function
updateRemCharacter().catch(console.error);
