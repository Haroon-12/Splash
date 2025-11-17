import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { notifications } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

// Get user notifications
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const unreadOnly = url.searchParams.get('unreadOnly') === 'true';
    const limit = parseInt(url.searchParams.get('limit') || '50');

    let query = db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, currentUser.id))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);

    if (unreadOnly) {
      query = query.where(
        and(
          eq(notifications.userId, currentUser.id),
          eq(notifications.isRead, false)
        )
      );
    }

    const userNotifications = await query;

    return NextResponse.json({ notifications: userNotifications });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch notifications' 
    }, { status: 500 });
  }
}

// Mark notification as read
export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { notificationId, markAllAsRead } = body;

    if (markAllAsRead) {
      // Mark all notifications as read
      await db
        .update(notifications)
        .set({
          isRead: true,
          readAt: new Date(),
        })
        .where(
          and(
            eq(notifications.userId, currentUser.id),
            eq(notifications.isRead, false)
          )
        );

      return NextResponse.json({ success: true });
    }

    if (!notificationId) {
      return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 });
    }

    // Mark specific notification as read
    const updatedNotification = await db
      .update(notifications)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, currentUser.id)
        )
      )
      .returning();

    if (updatedNotification.length === 0) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      notification: updatedNotification[0] 
    });

  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json({ 
      error: 'Failed to update notification' 
    }, { status: 500 });
  }
}

// Delete notification
export async function DELETE(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const notificationId = url.searchParams.get('id');

    if (!notificationId) {
      return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 });
    }

    // Delete notification
    const deletedNotification = await db
      .delete(notifications)
      .where(
        and(
          eq(notifications.id, parseInt(notificationId)),
          eq(notifications.userId, currentUser.id)
        )
      )
      .returning();

    if (deletedNotification.length === 0) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json({ 
      error: 'Failed to delete notification' 
    }, { status: 500 });
  }
}
