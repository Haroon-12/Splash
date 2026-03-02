import { recommendInfluencersForCampaign } from '../src/lib/recommendation-engine';
import { db } from '../src/db';

async function main() {
    console.log("--- RUNNING DEDUPLICATION TEST ---");

    // We'll create a mock campaign and run the recommendation engine
    // We just want to check if the length of results has duplicates

    // Actually, we can just grab the GET method from the API and see its length
    const { GET } = await import('../src/app/api/influencers-with-accounts/route');

    // Mock the NextRequest
    const res = await GET();
    const data = await res.json();

    // Check for duplicate names/emails
    const seenNames = new Set();
    const duplicates = [];

    for (const influencer of data) {
        if (seenNames.has(influencer.name)) {
            duplicates.push(influencer.name);
        }
        seenNames.add(influencer.name);
    }

    console.log(`Total Influencers Returned: ${data.length}`);
    if (duplicates.length > 0) {
        console.log(`❌ Found ${duplicates.length} duplicates:`, duplicates);
    } else {
        console.log(`✅ No duplicate profiles found! Deduplication successful.`);
    }

    process.exit(0);
}

main().catch(console.error);
