import { db } from '../src/db';
import { user } from '../src/db/schema';

async function main() {
    console.log("--- DB DUPLICATE CHECK ---");

    const users = await db.query.user.findMany({
        where: (user, { eq }) => eq(user.userType, 'influencer')
    });

    const dbNames = new Map();
    const dbDuplicates = [];

    users.forEach(u => {
        if (!u.name) return;
        const lowered = u.name.toLowerCase().trim();
        if (dbNames.has(lowered)) {
            dbDuplicates.push(u.name);
        } else {
            dbNames.set(lowered, true);
        }
    });

    console.log(`DB User Count: ${users.length}`);
    if (dbDuplicates.length > 0) {
        console.log(`❌ Found ${dbDuplicates.length} duplicates INSIDE the database:`, dbDuplicates);
    } else {
        console.log(`✅ No duplicate names found inside the database.`);
    }

    process.exit(0);
}

main().catch(console.error);
