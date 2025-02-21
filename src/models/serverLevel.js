const mongoose = require('mongoose');

const serverLevelSchema = new mongoose.Schema({
    userId: { type: String, required: true},
    guildId: { type: String, required: true},
    exp: {type: Number, default: 0},
    level: {type: Number, default: 0}
});
serverLevelSchema.index({ userId: 1, guildId: 1 }, { unique: true });
const levels = mongoose.model('levels', serverLevelSchema);

module.exports = levels;
