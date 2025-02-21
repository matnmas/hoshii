const starsPerComet = 160;
const starsPerCrescent = 160;

function convertStarsToComet(stars){
    return Math.floor(stars/starsPerComet);
}

function convertStarsToCrescent(stars){
    return Math.floor(stars/starsPerCrescent);
}

module.exports = {
    convertStarsToComet,
    convertStarsToCrescent
};

