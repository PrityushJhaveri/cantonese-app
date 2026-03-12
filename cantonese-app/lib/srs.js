// Simple LocalStorage SRS Implementation
// Stores an object mapping "jyutping|cantonese" to a mastery score (1-5)

export function getMasteryScore(wordId) {
    if (typeof window === 'undefined') return 0;
    try {
        const srsData = JSON.parse(localStorage.getItem('cantonese_srs')) || {};
        return srsData[wordId] || 0;
    } catch (e) {
        return 0;
    }
}

export function updateMastery(wordId, isKnown) {
    if (typeof window === 'undefined') return 0;

    try {
        const srsData = JSON.parse(localStorage.getItem('cantonese_srs')) || {};
        let currentScore = srsData[wordId] || 0;

        if (isKnown) {
            currentScore = Math.min(5, currentScore + 1);
        } else {
            currentScore = Math.max(0, currentScore - 2); // Penalize forgetting more heavily
        }

        srsData[wordId] = currentScore;
        localStorage.setItem('cantonese_srs', JSON.stringify(srsData));

        return currentScore;
    } catch (e) {
        console.error("SRS saving failed", e);
        return 0;
    }
}

// Generate a word ID
export function getWordId(word) {
    return `${word.unit}-${word.number}-${word.jyutping}`;
}

export function sortWordsBySRS(words) {
    if (typeof window === 'undefined') return words;

    const srsData = JSON.parse(localStorage.getItem('cantonese_srs')) || {};

    // Create a copy of the array and sort
    // Lower score (less mastery) should appear first
    return [...words].sort((a, b) => {
        const scoreA = srsData[getWordId(a)] || 0;
        const scoreB = srsData[getWordId(b)] || 0;
        return scoreA - scoreB;
    });
}

// Star functionality
export function toggleStar(wordId) {
    if (typeof window === 'undefined') return false;
    try {
        const starredData = JSON.parse(localStorage.getItem('cantonese_starred')) || {};
        if (starredData[wordId]) {
            delete starredData[wordId];
        } else {
            starredData[wordId] = true;
        }
        localStorage.setItem('cantonese_starred', JSON.stringify(starredData));
        return !!starredData[wordId];
    } catch (e) {
        return false;
    }
}

export function isStarred(wordId) {
    if (typeof window === 'undefined') return false;
    try {
        const starredData = JSON.parse(localStorage.getItem('cantonese_starred')) || {};
        return !!starredData[wordId];
    } catch (e) {
        return false;
    }
}
