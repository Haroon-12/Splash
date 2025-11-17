import { db } from "@/db";
import { user, adminAccounts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

async function createSuperAdmin() {
  try {
    console.log("Creating super admin account...");

    // Create the super admin user
    const { data, error } = await auth.api.signUpEmail({
      body: {
        email: "admin@splash.com",
        password: "Admin123!@#",
        name: "Super Admin",
      },
    });

    if (error) {
      console.error("Error creating admin user:", error);
      return;
    }

    if (!data?.user?.id) {
      console.error("No user ID returned");
      return;
    }

    console.log("Admin user created with ID:", data.user.id);

    // Update user type to admin
    await db
      .update(user)
      .set({ 
        userType: "admin",
        isApproved: true,
        approvedBy: data.user.id, // Self-approved
        approvedAt: new Date()
      })
      .where(eq(user.id, data.user.id));

    // Create admin account record
    await db.insert(adminAccounts).values({
      id: data.user.id,
      createdBy: data.user.id, // Self-created
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
