import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { teams, teamMembers, user, subscriptions } from "@/db/schema";
import { eq, and, count } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = session.user as any;
    
    // Ensure only brands can manage teams
    if (currentUser.userType !== "brand") {
      return NextResponse.json({ error: "Only brands can manage teams." }, { status: 403 });
    }

    // Resolve Team Workspace (Check membership first, then ownership)
    let team: any = null;
    const membership = await db.query.teamMembers.findFirst({
      where: eq(teamMembers.userId, currentUser.id),
    });

    if (membership) {
      team = await db.query.teams.findFirst({
        where: eq(teams.id, membership.teamId),
      });
    }

    if (!team) {
      team = await db.query.teams.findFirst({
        where: eq(teams.ownerId, currentUser.id),
      });
      
      // If no team exists, create one lazily
      if (!team) {
        const newTeamId = randomUUID();
        await db.insert(teams).values({
          id: newTeamId,
          name: `${currentUser.name}'s Team`,
          ownerId: currentUser.id,
        });
        team = { id: newTeamId, name: `${currentUser.name}'s Team`, ownerId: currentUser.id, createdAt: new Date() };
      }
    }

    // Get team members and join with user table to get names/emails
    const members = await db
      .select({
        id: teamMembers.id,
        userId: teamMembers.userId,
        role: teamMembers.role,
        joinedAt: teamMembers.joinedAt,
        user: {
          name: user.name,
          email: user.email,
          image: user.image,
        }
      })
      .from(teamMembers)
      .leftJoin(user, eq(teamMembers.userId, user.id))
      .where(eq(teamMembers.teamId, team.id));

    // Append owner to the list
    const ownerUser = await db.query.user.findFirst({
      where: eq(user.id, team.ownerId)
    });

    if (ownerUser) {
      const ownerInList = members.some((m: any) => m.userId === ownerUser.id);
      if (!ownerInList) {
        members.unshift({
          id: -1,
          userId: ownerUser.id,
          role: "owner",
          joinedAt: team.createdAt,
          user: {
            name: ownerUser.name,
            email: ownerUser.email,
            image: ownerUser.image,
          }
        });
      }
    }

    // Also get subscription of the team owner to know limits
    const subscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.brandId, team.ownerId),
    });

    return NextResponse.json({
      team,
      members,
      subscription: subscription || { planType: "basic", status: "inactive" },
    });
  } catch (error: any) {
    console.error("Fetch team error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = session.user as any;
    
    if (currentUser.userType !== "brand") {
      return NextResponse.json({ error: "Only brands can invite members." }, { status: 403 });
    }

    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Find the user to invite
    const invitedUser = await db.query.user.findFirst({
      where: eq(user.email, email),
    });

    if (!invitedUser) {
      return NextResponse.json({ error: "No user found with this email. They must register first." }, { status: 404 });
    }

    if ((invitedUser as any).userType !== "brand") {
      return NextResponse.json({ error: "You can only invite other Brand accounts to your team workspace." }, { status: 400 });
    }

    if (invitedUser.id === currentUser.id) {
      return NextResponse.json({ error: "You cannot invite yourself." }, { status: 400 });
    }

    // Resolve Team Workspace
    let team: any = null;
    const membership = await db.query.teamMembers.findFirst({
      where: eq(teamMembers.userId, currentUser.id),
    });

    if (membership) {
      team = await db.query.teams.findFirst({
        where: eq(teams.id, membership.teamId),
      });
    }

    if (!team) {
      team = await db.query.teams.findFirst({
        where: eq(teams.ownerId, currentUser.id),
      });

      if (!team) {
        const newTeamId = randomUUID();
        await db.insert(teams).values({
          id: newTeamId,
          name: `${currentUser.name}'s Team`,
          ownerId: currentUser.id,
        });
        team = { id: newTeamId, name: `${currentUser.name}'s Team`, ownerId: currentUser.id, createdAt: new Date() };
      }
    }

    // Verify 10 member limit
    const memberCountRes = await db.select({ count: count() })
      .from(teamMembers)
      .where(eq(teamMembers.teamId, team.id));
      
    if (memberCountRes[0].count >= 10) {
      return NextResponse.json({ error: "This team has reached the maximum capacity of 10 members." }, { status: 400 });
    }

    // Check if user is already in the team
    const existingMember = await db.query.teamMembers.findFirst({
      where: and(eq(teamMembers.teamId, team.id), eq(teamMembers.userId, invitedUser.id)),
    });

    if (existingMember) {
      return NextResponse.json({ error: "User is already in the team." }, { status: 400 });
    }

    // Add member to team
    await db.insert(teamMembers).values({
      teamId: team.id,
      userId: invitedUser.id,
      role: "member",
    });

    return NextResponse.json({ success: true, message: "Member added successfully" });
  } catch (error: any) {
    console.error("Add team member error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = session.user as any;
    
    if (currentUser.userType !== "brand") {
      return NextResponse.json({ error: "Only brands can remove members." }, { status: 403 });
    }

    const url = new URL(req.url);
    const memberId = url.searchParams.get("id");
    
    if (!memberId) {
      return NextResponse.json({ error: "Member ID is required" }, { status: 400 });
    }

    // Resolve Team Workspace
    let team: any = null;
    const membership = await db.query.teamMembers.findFirst({
      where: eq(teamMembers.userId, currentUser.id),
    });

    if (membership) {
      team = await db.query.teams.findFirst({
        where: eq(teams.id, membership.teamId),
      });
    }

    if (!team) {
      team = await db.query.teams.findFirst({
        where: eq(teams.ownerId, currentUser.id),
      });
    }

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Remove member
    await db.delete(teamMembers).where(
      and(
        eq(teamMembers.id, parseInt(memberId)),
        eq(teamMembers.teamId, team.id)
      )
    );

    return NextResponse.json({ success: true, message: "Member removed successfully" });
  } catch (error: any) {
    console.error("Remove team member error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
