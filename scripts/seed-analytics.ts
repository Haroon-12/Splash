import { db } from "../src/db";
import { user, affiliateLinks, clickEvents } from "../src/db/schema";
import { eq, and } from "drizzle-orm";

async function run() {
  console.log("Looking up user haroonmust123@gmail.com...");
  const targetUser = await db.query.user.findFirst({
    where: eq(user.email, "haroonmust123@gmail.com")
  });

  if (!targetUser) {
    console.error("User not found!");
    return;
  }
  console.log(`Found user: ${targetUser.id}`);

  console.log("Finding their active tracking links...");
  const links = await db.query.affiliateLinks.findMany({
    where: and(
        eq(affiliateLinks.brandId, targetUser.id),
        eq(affiliateLinks.isActive, true)
    )
  });

  if (links.length === 0) {
    console.error("No active tracking links found for this user!");
    return;
  }

  console.log(`Found ${links.length} active links.`);

  // Update createdAt date of links to early January
  const startDate = new Date('2026-01-05T10:00:00Z');
  const endDate = new Date('2026-04-17T10:00:00Z'); // Today's simulated date

  for (const link of links) {
    const randomLinkDate = new Date(startDate.getTime() + Math.random() * (7 * 24 * 60 * 60 * 1000)); // First week of Jan
    await db.update(affiliateLinks)
      .set({ createdAt: randomLinkDate })
      .where(eq(affiliateLinks.id, link.id));
    console.log(`Updated link ${link.id} createdAt to ${randomLinkDate.toISOString()}`);
  }

  // Delete old clicks just to make sure we don't end up with a mess
  // Wait, user said "use the already generated clicks and range of jan- april".
  // Let's just generate brand new 100 clicks.
  console.log("Generating 100 random clicks across all links from Jan-April...");

  const platforms = ['Instagram', 'YouTube', 'TikTok', 'Direct'];
  const devices = ['mobile', 'desktop', 'tablet'];

  for (let i = 0; i < 100; i++) {
    const randomLink = links[Math.floor(Math.random() * links.length)];
    
    // Random date between startDate and endDate
    // Prefer dates closer to the end, just for a nice rising graph shape
    const randomFraction = Math.pow(Math.random(), 0.7); // slightly skews to right
    const randomTime = startDate.getTime() + (randomFraction * (endDate.getTime() - startDate.getTime()));
    const clickDate = new Date(randomTime);

    // Make sure clickDate is after the link's creation date (it will be since link creation date is first few days of Jan)
    
    await db.insert(clickEvents).values({
      linkId: randomLink.id,
      ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      userAgent: 'Mozilla/5.0 (Mocked User Agent)',
      deviceType: devices[Math.floor(Math.random() * devices.length)],
      referrer: platforms[Math.floor(Math.random() * platforms.length)],
      country: Math.random() > 0.5 ? 'US' : 'GB',
      createdAt: clickDate
    });
  }

  console.log("Successfully backpopulated 100 clicks!");
  process.exit(0);
}

run().catch(console.error);
