import { db } from '@/db';
import { user } from '@/db/schema';

async function main() {
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;

    const sampleUsers = [
        // 1. Admin User
        {
            id: 'admin_splash_01',
            name: 'Admin User',
            email: 'admin@splash.com',
            emailVerified: true,
            image: null,
            userType: 'admin',
            isApproved: true,
            approvedBy: null,
            approvedAt: null,
            createdAt: new Date(now - 14 * dayInMs),
            updatedAt: new Date(now - 14 * dayInMs),
        },
        
        // 2. Approved Influencers (5 users)
        {
            id: 'influencer_01',
            name: 'Sarah Martinez',
            email: 'sarah.martinez@instagram.com',
            emailVerified: true,
            image: 'https://i.pravatar.cc/150?img=1',
            userType: 'influencer',
            isApproved: true,
            approvedBy: 'admin_splash_01',
            approvedAt: new Date(now - 10 * dayInMs),
            createdAt: new Date(now - 12 * dayInMs),
            updatedAt: new Date(now - 10 * dayInMs),
        },
        {
            id: 'influencer_02',
            name: 'James Chen',
            email: 'james.chen@social.media',
            emailVerified: true,
            image: 'https://i.pravatar.cc/150?img=2',
            userType: 'influencer',
            isApproved: true,
            approvedBy: 'admin_splash_01',
            approvedAt: new Date(now - 8 * dayInMs),
            createdAt: new Date(now - 11 * dayInMs),
            updatedAt: new Date(now - 8 * dayInMs),
        },
        {
            id: 'influencer_03',
            name: 'Emma Thompson',
            email: 'emma.thompson@content.creator',
            emailVerified: true,
            image: 'https://i.pravatar.cc/150?img=3',
            userType: 'influencer',
            isApproved: true,
            approvedBy: 'admin_splash_01',
            approvedAt: new Date(now - 5 * dayInMs),
            createdAt: new Date(now - 9 * dayInMs),
            updatedAt: new Date(now - 5 * dayInMs),
        },
        {
            id: 'influencer_04',
            name: 'Michael Rodriguez',
            email: 'michael.rodriguez@influencer.pro',
            emailVerified: true,
            image: 'https://i.pravatar.cc/150?img=4',
            userType: 'influencer',
            isApproved: true,
            approvedBy: 'admin_splash_01',
            approvedAt: new Date(now - 7 * dayInMs),
            createdAt: new Date(now - 10 * dayInMs),
            updatedAt: new Date(now - 7 * dayInMs),
        },
        {
            id: 'influencer_05',
            name: 'Olivia Davis',
            email: 'olivia.davis@lifestyle.blog',
            emailVerified: true,
            image: 'https://i.pravatar.cc/150?img=5',
            userType: 'influencer',
            isApproved: true,
            approvedBy: 'admin_splash_01',
            approvedAt: new Date(now - 3 * dayInMs),
            createdAt: new Date(now - 6 * dayInMs),
            updatedAt: new Date(now - 3 * dayInMs),
        },
        
        // 3. Approved Brands (3 users)
        {
            id: 'brand_01',
            name: 'TechStyle Innovations',
            email: 'partnerships@techstyle.com',
            emailVerified: true,
            image: 'https://i.pravatar.cc/150?img=11',
            userType: 'brand',
            isApproved: true,
            approvedBy: 'admin_splash_01',
            approvedAt: new Date(now - 9 * dayInMs),
            createdAt: new Date(now - 14 * dayInMs),
            updatedAt: new Date(now - 9 * dayInMs),
        },
        {
            id: 'brand_02',
            name: 'EcoWear Apparel',
            email: 'marketing@ecowear.com',
            emailVerified: true,
            image: 'https://i.pravatar.cc/150?img=12',
            userType: 'brand',
            isApproved: true,
            approvedBy: 'admin_splash_01',
            approvedAt: new Date(now - 6 * dayInMs),
            createdAt: new Date(now - 11 * dayInMs),
            updatedAt: new Date(now - 6 * dayInMs),
        },
        {
            id: 'brand_03',
            name: 'FitLife Nutrition',
            email: 'collabs@fitlifenutrition.com',
            emailVerified: true,
            image: 'https://i.pravatar.cc/150?img=13',
            userType: 'brand',
            isApproved: true,
            approvedBy: 'admin_splash_01',
            approvedAt: new Date(now - 5 * dayInMs),
            createdAt: new Date(now - 8 * dayInMs),
            updatedAt: new Date(now - 5 * dayInMs),
        },
        
        // 4. Pending Users (2 users)
        {
            id: 'influencer_06',
            name: 'Alex Johnson',
            email: 'alex.johnson@newcreator.com',
            emailVerified: true,
            image: 'https://i.pravatar.cc/150?img=6',
            userType: 'influencer',
            isApproved: false,
            approvedBy: null,
            approvedAt: null,
            createdAt: new Date(now - 2 * dayInMs),
            updatedAt: new Date(now - 2 * dayInMs),
        },
        {
            id: 'brand_04',
            name: 'Urban Glow Cosmetics',
            email: 'contact@urbanglow.com',
            emailVerified: true,
            image: 'https://i.pravatar.cc/150?img=14',
            userType: 'brand',
            isApproved: false,
            approvedBy: null,
            approvedAt: null,
            createdAt: new Date(now - 1 * dayInMs),
            updatedAt: new Date(now - 1 * dayInMs),
        },
    ];

    await db.insert(user).values(sampleUsers);
    
    console.log('✅ Users seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});