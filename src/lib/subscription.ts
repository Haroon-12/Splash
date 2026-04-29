import { db } from "@/db";
import { subscriptions, teamMembers, teams } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getUserSubscription(userId: string) {
  // 1. Check user's own subscription
  const sub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.brandId, userId),
  });

  const checkExpiry = (s: any) => {
    if (!s) return null;
    if (s.status !== "active") return s;
    if (s.currentPeriodEnd && new Date(s.currentPeriodEnd).getTime() < Date.now()) {
      return { ...s, status: "inactive", planType: "basic" };
    }
    return s;
  };

  const activeSub = checkExpiry(sub);

  // 2. Check if user is in a team
  const membership = await db.query.teamMembers.findFirst({
    where: eq(teamMembers.userId, userId),
  });

  let inheritedSub = null;

  if (membership) {
    const team = await db.query.teams.findFirst({
      where: eq(teams.id, membership.teamId),
    });

    if (team) {
      const ownerSub = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.brandId, team.ownerId),
      });

      const activeOwnerSub = checkExpiry(ownerSub);

      // Inherit if owner has an active team plan
      if (activeOwnerSub?.status === "active" && activeOwnerSub?.planType === "team") {
        inheritedSub = activeOwnerSub;
      }
    }
  }

  // 3. Return the best subscription (prefer inherited team plan over personal basic)
  if (inheritedSub && (!activeSub || activeSub.planType !== "team")) {
    return inheritedSub;
  }

  return activeSub;
}
