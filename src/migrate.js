const mongoose = require('mongoose');
const { MONGODB_URI } = require('./config.json'); // Update this path if necessary

const dbName = 'test'; // Your MongoDB database name

// Define the Character schema
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

async function runMigration() {
    try {
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI, { dbName });
        console.log('Connected to MongoDB Atlas');

        // Update all characters to include the 'constellationImages' field
        const updateResult = await Character.updateMany(
            { },  // Match all characters
            { $set: { constellationImages: [] } }  // Set default value for constellationImages
        );

        console.log('Update operation result:', updateResult);

    } catch (error) {
        console.error('Error during migration:', error);
    } finally {
        // Close the MongoDB connection
        await mongoose.disconnect();
        console.log('MongoDB Atlas connection closed');
    }
}

// Run the migration
runMigration();
