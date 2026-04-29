import { db } from '../src/db';
import { affiliateLinks, clickEvents, user, campaigns } from '../src/db/schema';
import { eq, desc, sql } from 'drizzle-orm';

async function main() {
    console.log('=== Analytics Sanity Check ===');

    const links = await db.select().from(affiliateLinks).limit(10);
    console.log('Found ' + links.length + ' total links.');

    const clicks = await db.select().from(clickEvents).limit(10);
    console.log('Found ' + clicks.length + ' total tracked clicks.');

    const rawLinks = await db
        .select({
            id: affiliateLinks.id,
            title: affiliateLinks.title,
            clicksCount: sql<number>`count(${clickEvents.id})`,
        })
        .from(affiliateLinks)
        .leftJoin(clickEvents, eq(affiliateLinks.id, clickEvents.linkId))
        .groupBy(affiliateLinks.id);

    const groupedMap = new Map();
    rawLinks.forEach((link: any) => {
        const rawTitle = link.title || 'Untitled Link';
        if (!groupedMap.has(rawTitle)) {
            groupedMap.set(rawTitle, { count: 0, clicks: 0 });
        }
        const master = groupedMap.get(rawTitle);
        master.count++;
        master.clicks += Number(link.clicksCount) || 0;
    });

    console.log('\nFound ' + groupedMap.size + ' Master Links spanning ' + rawLinks.length + ' sub-links.');
    for (const [title, stats] of groupedMap.entries()) {
        console.log(' - ' + title + ' -> Assigned to ' + stats.count + ' influencers, Generated ' + stats.clicks + ' clicks');
    }

    process.exit(0);
}
main().catch(console.error);
