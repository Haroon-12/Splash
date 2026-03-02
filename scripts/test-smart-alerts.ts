import { db } from '../src/db/index';
import { notifications, user } from '../src/db/schema';

async function seedTestAlerts() {
    console.log("--- GENERATING TEST SMART ALERTS & NOTIFICATIONS ---");

    // 1. Get the first user in the DB (assuming the user testing is logged in as them)
    const allUsers = await db.select().from(user).limit(1);

    if (allUsers.length === 0) {
        console.error("❌ No users found in the database. Please create an account and log in first.");
        process.exit(1);
    }

    const testUser = allUsers[0];
    console.log(`Injecting test alerts for user: ${testUser.name} (ID: ${testUser.id})`);

    try {
        // 2. Insert Standard Notifications
        console.log("Injecting 2 Standard Notifications...");
        await db.insert(notifications).values([
            {
                userId: testUser.id,
                type: 'new_message',
                title: 'New Message from Nike',
                message: 'Hey! We love your content and would like to discuss a potential partnership for our Summer campaign.',
                isSmartAlert: false, // Explicitly false for standard notifications
                actionUrl: '/dashboard/chat',
            },
            {
                userId: testUser.id,
                type: 'claim_approved',
                title: 'Profile Claim Approved',
                message: 'Congratulations! Your profile claim request has been reviewed and approved by our admins.',
                isSmartAlert: false,
                actionUrl: '/dashboard/profile',
            }
        ]);

        // 3. Insert Smart Alerts
        console.log("Injecting 3 Smart Alerts (AI Insights)...");
        await db.insert(notifications).values([
            {
                userId: testUser.id,
                type: 'profile_optimization',
                title: 'Profile Optimization Opportunity ✨',
                message: 'Your profile gets 3x more visibility with a complete portfolio and rate card. Take 2 minutes to upload them now!',
                isSmartAlert: true, // Explicitly true for Smart Alerts
                actionUrl: '/dashboard/profile/edit',
            },
            {
                userId: testUser.id,
                type: 'campaign_match',
                title: 'High Compatibility Campaign Match 🚀',
                message: 'L\'Oréal just launched "Summer Glow", and your profile perfectly aligns with their required category and follower count!',
                isSmartAlert: true,
                actionUrl: '/dashboard/campaigns',
            },
            {
                userId: testUser.id,
                type: 'conversation_follow_up',
                title: 'Action Required: Waiting for your reply ⏳',
                message: 'It has been over 48 hours since you received a message from Adidas. Prompt replies increase your collaboration success rate by 40%!',
                isSmartAlert: true,
                actionUrl: '/dashboard/chat',
            }
        ]);

        console.log("✅ Successfully injected! You can now verify the UI.");

    } catch (err) {
        console.error("❌ Failed to inject alerts:", err);
    }
}

seedTestAlerts();
