import { db } from '@/db';
import { conversations } from '@/db/schema';

async function main() {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const oneDay = 24 * oneHour;

    const sampleConversations = [
        {
            participant1Id: 'brand_01',
            participant2Id: 'influencer_01',
            lastMessageAt: new Date(now - 2 * oneHour),
            createdAt: new Date(now - 3 * oneDay),
        },
        {
            participant1Id: 'brand_01',
            participant2Id: 'influencer_02',
            lastMessageAt: new Date(now - oneHour),
            createdAt: new Date(now - 2 * oneDay),
        },
        {
            participant1Id: 'brand_02',
            participant2Id: 'influencer_02',
            lastMessageAt: new Date(now - oneDay),
            createdAt: new Date(now - 4 * oneDay),
        },
        {
            participant1Id: 'brand_02',
            participant2Id: 'influencer_03',
            lastMessageAt: new Date(now - 3 * oneHour),
            createdAt: new Date(now - 5 * oneDay),
        },
        {
            participant1Id: 'brand_03',
            participant2Id: 'influencer_01',
            lastMessageAt: null,
            createdAt: new Date(now - oneDay),
        },
        {
            participant1Id: 'brand_01',
            participant2Id: 'influencer_03',
            lastMessageAt: new Date(now - 2 * oneDay),
            createdAt: new Date(now - 5 * oneDay),
        },
        {
            participant1Id: 'brand_03',
            participant2Id: 'influencer_02',
            lastMessageAt: new Date(now - 90 * 60 * 1000),
            createdAt: new Date(now - 2 * oneDay),
        },
    ];

    await db.insert(conversations).values(sampleConversations);
    
    console.log('✅ Conversations seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});