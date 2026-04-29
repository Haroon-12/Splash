import { db } from "@/db";
import { user, adminAccounts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

async function createSuperAdmin() {
  try {
    console.log("Creating super admin account...");

    // Create the super admin user
    const result = await auth.api.signUpEmail({
      body: {
        email: "admin@splash.com",
        password: "Admin123!@#",
        name: "Super Admin",
      },
    }) as { user?: { id: string } } | null;

    const userId = result?.user?.id;

    if (!userId) {
      console.error("No user ID returned — user may already exist.");
      return;
    }

    console.log("Admin user created with ID:", userId);

    // Update user type to admin
    await db
      .update(user)
      .set({ 
        userType: "admin",
        isApproved: true,
        approvedBy: userId, // Self-approved
        approvedAt: new Date()
      })
      .where(eq(user.id, userId));

    // Create admin account record
    await db.insert(adminAccounts).values({
      id: userId,
      createdBy: userId, // Self-created
      permissions: JSON.stringify(["all"]),
      isSuperAdmin: true,
    });

    console.log("✅ Super admin account created successfully!");
    console.log("📧 Email: admin@splash.com");
    console.log("🔑 Password: Admin123!@#");
    console.log("⚠️  Please change the password after first login!");

  } catch (error) {
    console.error("Error creating super admin:", error);
  }
}

createSuperAdmin();
