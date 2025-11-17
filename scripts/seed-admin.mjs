import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import * as schema from "../src/db/schema.js";

const now = new Date();

const ADMIN_NAME = process.env.ADMIN_NAME || "Admin User";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@example.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@12345";

async function main() {
    const url = process.env.TURSO_CONNECTION_URL || "file:local.db";
    const authToken = process.env.TURSO_AUTH_TOKEN || undefined;

    const client = createClient({ url, authToken });
    const db = drizzle(client, { schema });

    // Check if user exists
    const existing = await db.select().from(schema.user).where(eq(schema.user.email, ADMIN_EMAIL));
    let userId;
    if (existing.length > 0) {
        userId = existing[0].id;
        // Ensure admin flags
        await db.update(schema.user)
            .set({ userType: "admin", isApproved: 1, updatedAt: now })
            .where(eq(schema.user.id, userId));
    } else {
        userId = crypto.randomUUID();
        await db.insert(schema.user).values({
            id: userId,
            name: ADMIN_NAME,
            email: ADMIN_EMAIL,
            emailVerified: 1,
            image: null,
            userType: "admin",
            isApproved: 1,
            approvedBy: null,
            approvedAt: now,
            createdAt: now,
            updatedAt: now,
        });
    }

    // Ensure account with password exists for email login
    const accountId = `${ADMIN_EMAIL}`;
    const accounts = await db.select().from(schema.account).where(eq(schema.account.userId, userId));
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

    if (accounts.length === 0) {
        await db.insert(schema.account).values({
            id: crypto.randomUUID(),
            accountId,
            providerId: "email",
            userId,
            accessToken: null,
            refreshToken: null,
            idToken: null,
            accessTokenExpiresAt: null,
            refreshTokenExpiresAt: null,
            scope: null,
            password: passwordHash,
            createdAt: now,
            updatedAt: now,
        });
    } else {
        await db.update(schema.account)
            .set({ password: passwordHash, updatedAt: now })
            .where(eq(schema.account.userId, userId));
    }

    console.log(`Seeded admin user: ${ADMIN_EMAIL} (password: ${ADMIN_PASSWORD})`);
    await client.close();
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});


