import { db } from '../src/db';

const categorySynonyms: Record<string, string[]> = {
    'fashion': ['style', 'clothing', 'apparel', 'wardrobe', 'outfit', 'fashionista', 'fashionable', 'menswear', 'womenswear'],
    'beauty': ['cosmetics', 'makeup', 'skincare', 'cosmetic', 'grooming', 'haircare', 'fragrance'],
    'education': ['learning', 'teaching', 'academic', 'study', 'knowledge', 'tutorial', 'course', 'university'],
    'pets': ['animals', 'dogs', 'cats', 'pet care', 'animal', 'veterinary'],
    'technology': ['tech', 'gadgets', 'electronics', 'innovation', 'software', 'hardware', 'reviews', 'crypto', 'web3', 'programming', 'coding'],
    'gaming': ['games', 'video games', 'esports', 'gamer', 'streaming', 'twitch', 'playstation', 'xbox', 'nintendo'],
};

function normalizeCategory(category: string): string {
    return category
        .toLowerCase()
        .trim()
        .replace(/[&,\/]/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/[^\w\s]/g, '')
        .trim();
}

function extractWords(category: string): string[] {
    const normalized = normalizeCategory(category);
    return normalized.split(/\s+/).filter(word => word.length > 2);
}

function matchesSynonym(word: string, targetCategory: string): boolean {
    const targetLower = normalizeCategory(targetCategory);

    const isStrictMatch = (w1: string, w2: string) => {
        if (w1 === w2) return true;
        if (w1.length > 3 && w2.length > 3) {
            if (w1 + 's' === w2 || w2 + 's' === w1) return true;
            if (w1 + 'es' === w2 || w2 + 'es' === w1) return true;
            if (w1.endsWith('y') && w2.endsWith('ies') && w1.slice(0, -1) === w2.slice(0, -3)) return true;
            if (w2.endsWith('y') && w1.endsWith('ies') && w2.slice(0, -1) === w1.slice(0, -3)) return true;
        }
        return false;
    };

    const synonyms = categorySynonyms[targetLower] || [];

    if (synonyms.some(syn => isStrictMatch(syn, word))) {
        return true;
    }

    for (const [key, values] of Object.entries(categorySynonyms)) {
        if (values.some(syn => isStrictMatch(syn, word))) {
            if (isStrictMatch(key, targetLower)) {
                return true;
            }
        }
    }

    return false;
}

function categoryMatch(category1: string | null, category2: string | null): number {
    if (!category1 || !category2) return 0;

    const cat1Norm = normalizeCategory(category1);
    const cat2Norm = normalizeCategory(category2);

    if (cat1Norm === cat2Norm) {
        return 100;
    }

    const isStrictMatch = (w1: string, w2: string) => {
        if (w1 === w2) return true;
        if (w1.length > 3 && w2.length > 3) {
            if (w1 + 's' === w2 || w2 + 's' === w1) return true;
            if (w1 + 'es' === w2 || w2 + 'es' === w1) return true;
        }
        return false;
    };

    const words1 = extractWords(category1);
    const words2 = extractWords(category2);

    if (words1.length === 0 || words2.length === 0) {
        return 0;
    }

    const shorterWords = words1.length <= words2.length ? words1 : words2;
    const longerWords = words1.length > words2.length ? words1 : words2;

    let exactWordMatches = 0;
    let synonymMatches = 0;

    for (const shortWord of shorterWords) {
        for (const longWord of longerWords) {
            if (isStrictMatch(shortWord, longWord)) {
                exactWordMatches++;
                break;
            } else if (matchesSynonym(shortWord, longWord) || matchesSynonym(longWord, shortWord)) {
                synonymMatches++;
                break;
            }
        }
    }

    const totalMatches = exactWordMatches + synonymMatches;

    if (totalMatches > 0) {
        if (totalMatches === shorterWords.length) {
            return 100;
        }
        const matchRatio = totalMatches / longerWords.length;
        return Math.max(50, Math.round(matchRatio * 100));
    }

    for (const [key, synonyms] of Object.entries(categorySynonyms)) {
        const cat1HasKey = words1.some(w => isStrictMatch(w, key)) || words1.some(w => synonyms.some(syn => isStrictMatch(w, syn)));
        const cat2HasKey = words2.some(w => isStrictMatch(w, key)) || words2.some(w => synonyms.some(syn => isStrictMatch(w, syn)));

        if (cat1HasKey && cat2HasKey) {
            return 80;
        }
    }

    return 0;
}

const testCases = [
    { brand: 'Technology', influencer: 'Tech', expected: '>0', shouldPass: true },
    { brand: 'Tech & Gaming', influencer: 'Technology', expected: '>0', shouldPass: true },
    { brand: 'Education', influencer: 'Pets', expected: '0', shouldPass: false },
    { brand: 'Fashion', influencer: 'Food', expected: '0', shouldPass: false },
    { brand: 'Makeup', influencer: 'Beauty', expected: '>0', shouldPass: true },
    { brand: 'Lifestyle', influencer: 'Fashion & Style', expected: '0', shouldPass: false },
    { brand: 'Camera', influencer: 'Tech', expected: '0', shouldPass: false },
];

async function main() {
    console.log('--- RUNNING CATEGORY MATCH TESTS ---\n');

    let passed = 0;
    for (const test of testCases) {
        const score = categoryMatch(test.brand, test.influencer);
        let passes = false;

        if (test.shouldPass) {
            passes = score > 0;
        } else {
            passes = score === 0;
        }

        if (passes) {
            passed++;
            console.log(`✅ PASS: "${test.brand}" vs "${test.influencer}" -> Score: ${score}`);
        } else {
            console.log(`❌ FAIL: "${test.brand}" vs "${test.influencer}" -> Score: ${score} (Expected ${test.expected})`);
        }
    }
    console.log(`\nResults: ${passed}/${testCases.length} tests passed.`);
}

main();
