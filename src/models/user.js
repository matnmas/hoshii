const mongoose = require('mongoose');
const currency = require('../utils/currency');

const userSchema = new mongoose.Schema({
    userID: { type: String, required: true, unique: true },
    stars: { type: Number, default: 0 },
    comet: { type: Number, default: 0 },
    asteroid: { type: Number, default: 0 },
    void: { type: Number, default: 0 },
    starlight: { type: Number, default: 0 },
    shootingStar: { type: Number, default: 0 },
    crescent: { type: Number, default: 0 },
    exaltedStarlight: { type: Number, default: 0 },
    lastDaily: { type: Date },
    orbitLevel: { type: Number, default: 0 },
    XP: { type: Number, default: 0 },
    lastDropTime: { type: Date },
    bio: { type: String, default: 'Default bio, please set new one (/setBio)' },
    pulledCharacters: [{
        characterID: { type: mongoose.Schema.Types.ObjectId, ref: 'Character' },
        name: { type: String, required: true },
        rarity: { type: String, required: true },
        type: { type: String, required: true },
        constellations: { type: Number, default: 0 },
        datePulled: { type: Date, default: Date.now },
        image: { type: String },
        anime: {type: String},
        credits: {type: String} 
    }],
    totalPulls: { type: Number, default: 0 }, // Track total pulls
    pityPulls: { type: Number, default: 0 }  // Track pity pulls
});

// Method to convert stars to comets
userSchema.methods.convertStarsToComet = function() {
    const comets = currency.convertStarsToComet(this.stars);
    this.comet += comets;
    this.stars -= comets * 160;
    return this.save();
}

// Method to convert stars to crescents
userSchema.methods.convertStarsToCrescent = function() {
    const crescents = currency.convertStarsToCrescent(this.stars);
    this.crescent += crescents;
    this.stars -= crescents * 160;
    return this.save();
}

const User = mongoose.model('User', userSchema);

module.exports = User;
