import { db } from '../src/db';
import { user, affiliateLinks, clickEvents } from '../src/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

async function main() {
  const email = "haroonmust123@gmail.com";
  console.log(`Looking for user: ${email}...`);
  
  const targetUserList = await db.select().from(user).where(eq(user.email, email));
  if (targetUserList.length === 0) {
    console.error("User not found in DB! Creating dummy user or failing...");
    return;
  }
  const targetUser = targetUserList[0];
  console.log(`Found user ID: ${targetUser.id}`);

  let links = await db.select().from(affiliateLinks).where(eq(affiliateLinks.brandId, targetUser.id));
  if (links.length === 0) {
    links = await db.select().from(affiliateLinks).where(eq(affiliateLinks.influencerId, targetUser.id));
  }

  let linkId;
  if (links.length > 0) {
    linkId = links[0].id;
    console.log(`Found existing link: ${linkId}`);
  } else {
    linkId = randomUUID().substring(0, 8);
    console.log(`Creating new link: ${linkId}`);
    await db.insert(affiliateLinks).values({
      id: linkId,
      brandId: targetUser.id, 
      influencerId: targetUser.id,
      destinationUrl: "https://example.com/store",
      title: "Spring Campaign Link",
      createdAt: new Date("2026-01-01T00:00:00Z"),
    });
  }

  // Generate clicks from Jan 2026 to May 2026
  console.log("Generating realistic click data...");
  
  const startDate = new Date('2026-01-01T00:00:00Z').getTime();
  const endDate = new Date().getTime(); // Today
  
  const clicksToGenerate = 850;
  
  const chunk1 = [];
  for(let i=0; i<clicksToGenerate; i++) {
    // Bias towards more recent dates to make the chart look nice and active
    let randomTime = startDate + Math.random() * (endDate - startDate);
    if (Math.random() > 0.5) {
      randomTime = endDate - (Math.random() * 1000 * 60 * 60 * 24 * 60); // Bias last 60 days
    }
    
    const date = new Date(randomTime);
    const devices = ['mobile', 'mobile', 'mobile', 'desktop', 'tablet'];
    const referrers = ['instagram', 'instagram', 'tiktok', 'youtube', 'direct'];
    
    chunk1.push({
      linkId: linkId,
      ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
      deviceType: devices[Math.floor(Math.random() * devices.length)],
      referrer: referrers[Math.floor(Math.random() * referrers.length)],
      country: Math.random() > 0.7 ? 'UK' : 'US',
      createdAt: date
    });
  }
  
  // Insert in chunks of 100
  console.log(`Inserting ${clicksToGenerate} clicks in chunks...`);
  for (let i = 0; i < chunk1.length; i += 100) {
    const chunk = chunk1.slice(i, i + 100);
    await db.insert(clickEvents).values(chunk);
  }
  
  console.log(`✅ Successfully generated ${clicksToGenerate} analytics clicks for ${email}!`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Error running script:", err);
  process.exit(1);
});
