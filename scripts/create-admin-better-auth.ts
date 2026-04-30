import * as dotenv from "dotenv";
dotenv.config();

// NOW import the rest
import { auth } from "../src/lib/auth";
import { db } from "../src/db";
import { user as userTable } from "../src/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  console.log("Creating admin using Better Auth API (targeting Turso)...");
  
  try {
    const response = await auth.api.signUpEmail({
      body: {
        email: "admin@splash.com",
        password: "admin123@",
        name: "Super Admin",
      },
    });

    if (!response) {
        throw new Error("Failed to create user - no response");
    }

    console.log("User created:", response.user.email);

    // Now update userType to admin
    await db.update(userTable)
      .set({ userType: "admin", isApproved: true })
      .where(eq(userTable.id, response.user.id));

    console.log("User promoted to admin successfully!");
  } catch (error: any) {
    if (error.code === "USER_ALREADY_EXISTS" || (error.message && error.message.includes("already exists"))) {
        console.log("User already exists, attempting to reset...");
        // Use a direct SQL query to delete if the schema check fails on local
        await db.delete(userTable).where(eq(userTable.email, "admin@splash.com"));
        console.log("Existing user deleted. Re-running creation...");
        return main();
    }
    console.error("Error details:", error);
  }
}

main().catch(console.error);
