const mongoose = require('mongoose');

const characterSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true }, // Character name
    rarity: { type: String, required: true }, // 5-star, 4-star, etc.
    type: { type: String, required: true }, // to be determined what kind
    banner: { type: String, required: true }, // 'standard', 'limited', etc.
    imageUrl: { type: String }, // URL for the character's default image
    constellationImages: { type: [String], default: [] }, // Array of images for each constellation level (up to 6)
    credits: { type: String },
    anime: { type: String }
});

const Character = mongoose.model('Character', characterSchema);

module.exports = Character;
