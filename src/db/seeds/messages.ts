import { db } from '@/db';
import { messages } from '@/db/schema';

async function main() {
    const now = Date.now();
    const oneHourAgo = now - (1 * 60 * 60 * 1000);
    const oneDayAgo = now - (1 * 24 * 60 * 60 * 1000);
    const twoDaysAgo = now - (2 * 24 * 60 * 60 * 1000);
    const threeDaysAgo = now - (3 * 24 * 60 * 60 * 1000);
    const fourDaysAgo = now - (4 * 24 * 60 * 60 * 1000);
    const fiveDaysAgo = now - (5 * 24 * 60 * 60 * 1000);

    const sampleMessages = [
        // Conversation 1: brand_01 and influencer_01
        {
            conversationId: 1,
            senderId: 'brand_01',
            content: 'Hi! We love your content and would like to discuss a potential collaboration for our new product line.',
            isRead: true,
            readAt: new Date(fiveDaysAgo + (2 * 60 * 60 * 1000)),
            createdAt: new Date(fiveDaysAgo),
        },
        {
            conversationId: 1,
            senderId: 'influencer_01',
            content: 'Thank you for reaching out! I\'d be very interested in learning more about this opportunity.',
            isRead: true,
            readAt: new Date(fourDaysAgo + (3 * 60 * 60 * 1000)),
            createdAt: new Date(fourDaysAgo),
        },
        {
            conversationId: 1,
            senderId: 'brand_01',
            content: 'Great! We\'re launching a sustainable fashion collection next month. We think it aligns perfectly with your values.',
            isRead: true,
            readAt: new Date(fourDaysAgo + (6 * 60 * 60 * 1000)),
            createdAt: new Date(fourDaysAgo + (4 * 60 * 60 * 1000)),
        },
        {
            conversationId: 1,
            senderId: 'influencer_01',
            content: 'That sounds amazing! What would the partnership entail? Also, what\'s the timeline for content creation?',
            isRead: false,
            readAt: null,
            createdAt: new Date(oneHourAgo),
        },

        // Conversation 2: brand_02 and influencer_02
        {
            conversationId: 2,
            senderId: 'brand_02',
            content: 'We noticed your engagement rates are excellent. Would you be interested in being a brand ambassador?',
            isRead: true,
            readAt: new Date(threeDaysAgo + (4 * 60 * 60 * 1000)),
            createdAt: new Date(threeDaysAgo),
        },
        {
            conversationId: 2,
            senderId: 'influencer_02',
            content: 'I\'m definitely interested! Could you share more details about the ambassador program and compensation?',
            isRead: true,
            readAt: new Date(threeDaysAgo + (8 * 60 * 60 * 1000)),
            createdAt: new Date(threeDaysAgo + (5 * 60 * 60 * 1000)),
        },
        {
            conversationId: 2,
            senderId: 'brand_02',
            content: 'Of course! We offer a 6-month contract with monthly retainer plus commission on sales. Let me send over the proposal.',
            isRead: false,
            readAt: null,
            createdAt: new Date(twoDaysAgo),
        },

        // Conversation 3: brand_03 and influencer_03
        {
            conversationId: 3,
            senderId: 'influencer_03',
            content: 'Hi! I saw your recent campaign and love the creative direction. Are you looking for content creators?',
            isRead: true,
            readAt: new Date(fourDaysAgo + (1 * 60 * 60 * 1000)),
            createdAt: new Date(fourDaysAgo),
        },
        {
            conversationId: 3,
            senderId: 'brand_03',
            content: 'Yes, we are! Your portfolio is impressive. We have an upcoming product launch that might be perfect for you.',
            isRead: true,
            readAt: new Date(threeDaysAgo + (2 * 60 * 60 * 1000)),
            createdAt: new Date(threeDaysAgo),
        },
        {
            conversationId: 3,
            senderId: 'influencer_03',
            content: 'Wonderful! When is the launch scheduled? I want to make sure I can dedicate proper time to this.',
            isRead: true,
            readAt: new Date(twoDaysAgo + (5 * 60 * 60 * 1000)),
            createdAt: new Date(twoDaysAgo),
        },
        {
            conversationId: 3,
            senderId: 'brand_03',
            content: 'Launch is mid-next month. We\'d need content ready two weeks prior. Does that work with your schedule?',
            isRead: false,
            readAt: null,
            createdAt: new Date(oneDayAgo),
        },

        // Conversation 4: brand_04 and influencer_04
        {
            conversationId: 4,
            senderId: 'brand_04',
            content: 'Your recent video about skincare routines was fantastic! We\'d love to send you our new serum line to try.',
            isRead: true,
            readAt: new Date(fiveDaysAgo + (3 * 60 * 60 * 1000)),
            createdAt: new Date(fiveDaysAgo),
        },
        {
            conversationId: 4,
            senderId: 'influencer_04',
            content: 'Thank you so much! I\'d be happy to try them. Are you looking for honest reviews or sponsored content?',
            isRead: true,
            readAt: new Date(fourDaysAgo + (2 * 60 * 60 * 1000)),
            createdAt: new Date(fourDaysAgo),
        },
        {
            conversationId: 4,
            senderId: 'brand_04',
            content: 'We value authentic reviews. If you love the products, we can discuss a partnership. No pressure though!',
            isRead: false,
            readAt: null,
            createdAt: new Date(threeDaysAgo),
        },
    ];

    await db.insert(messages).values(sampleMessages);
    
    console.log('✅ Messages seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});