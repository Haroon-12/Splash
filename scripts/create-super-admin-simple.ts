import { db } from "@/db";
import { user, adminAccounts } from "@/db/schema";
import { eq } from "drizzle-orm";

async function createSuperAdmin() {
  try {
    console.log("Creating super admin account...");

    // Check if admin already exists
    const existingAdmin = await db
      .select()
      .from(user)
      .where(eq(user.email, "admin@splash.com"))
      .limit(1);

    if (existingAdmin.length > 0) {
      console.log("✅ Super admin account already exists!");
      console.log("📧 Email: admin@splash.com");
      console.log("🔑 Password: Admin123!@#");
      return;
    }

    // Create the super admin user directly in database
    const adminUser = await db
      .insert(user)
      .values({
        id: "admin-" + Date.now(),
        name: "Super Admin",
        email: "admin@splash.com",
        emailVerified: true,
        userType: "admin",
        isApproved: true,
        approvedBy: "admin-" + Date.now(), // Self-approved
        approvedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning() as Array<{ id: string; name: string | null; email: string }>;

    console.log("Admin user created with ID:", adminUser[0].id);

    // Create admin account record
    await db.insert(adminAccounts).values({
      id: adminUser[0].id,
      createdBy: adminUser[0].id, // Self-created
      permissions: JSON.stringify(["all"]),
      isSuperAdmin: true,
    });

    console.log("✅ Super admin account created successfully!");
    console.log("📧 Email: admin@splash.com");
    console.log("🔑 Password: Admin123!@#");
    console.log("⚠️  Note: You'll need to use the 'Forgot Password' feature to set the password");
    console.log("⚠️  Or register normally with these credentials if the account doesn't exist");

  } catch (error) {
    console.error("Error creating super admin:", error);
  }
}

createSuperAdmin();
