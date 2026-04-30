import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import * as schema from "../src/db/schema";
import * as dotenv from "dotenv";

dotenv.config();

const ADMIN_NAME = "Super Admin";
const ADMIN_EMAIL = "admin@splash.com";
const ADMIN_PASSWORD = "admin123@";

async function main() {
  const url = process.env.TURSO_CONNECTION_URL!;
  const authToken = process.env.TURSO_AUTH_TOKEN!;

  console.log(`Connecting to Turso at ${url}...`);
  const client = createClient({ url, authToken });
  const db = drizzle(client, { schema });

  const now = new Date();

  // 1. Check/Create User
  const existingUser = await db
    .select()
    .from(schema.user)
    .where(eq(schema.user.email, ADMIN_EMAIL));

  let userId: string;
  if (existingUser.length > 0) {
    userId = existingUser[0].id;
    console.log(`User already exists with ID: ${userId}. Updating to admin...`);
    await db
      .update(schema.user)
      .set({ 
        userType: "admin", 
        isApproved: true, 
        isSuspended: false,
        updatedAt: now 
      })
      .where(eq(schema.user.id, userId));
  } else {
    userId = crypto.randomUUID();
    console.log(`Creating new admin user with ID: ${userId}...`);
    await db.insert(schema.user).values({
      id: userId,
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      emailVerified: true,
      userType: "admin",
      isApproved: true,
      isSuspended: false,
      createdAt: now,
      updatedAt: now,
    });
  }

  // 2. Check/Create Account (Credentials)
  const existingAccount = await db
    .select()
    .from(schema.account)
    .where(eq(schema.account.userId, userId));

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  if (existingAccount.length === 0) {
    console.log(`Creating account credentials for ${ADMIN_EMAIL}...`);
    await db.insert(schema.account).values({
      id: crypto.randomUUID(),
      accountId: ADMIN_EMAIL,
      providerId: "email",
      userId,
      password: passwordHash,
      createdAt: now,
      updatedAt: now,
    });
  } else {
    console.log(`Updating existing credentials for ${ADMIN_EMAIL}...`);
    await db
      .update(schema.account)
      .set({ 
        password: passwordHash, 
        updatedAt: now 
      })
      .where(eq(schema.account.userId, userId));
  }

  console.log(`\n=== ADMIN CREATED SUCCESSFULLY ===`);
  console.log(`Email: ${ADMIN_EMAIL}`);
  console.log(`Password: ${ADMIN_PASSWORD}`);
  console.log(`==================================\n`);

  await client.close();
}

main().catch((err) => {
  console.error("Error creating admin:", err);
  process.exit(1);
});
