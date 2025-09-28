import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { spaces, spaceMembers, messages, users, insertMessageSchema } from '@shared/schema'
import { eq, and, desc, lt } from 'drizzle-orm'
import { z } from 'zod'
import { ServerRealtimeManager } from '@/lib/supabase-server'

async function isSpaceMember(spaceId: string, userId: string): Promise<boolean> {
  const result = await db
    .select()
    .from(spaceMembers)
    .where(and(
      eq(spaceMembers.spaceId, spaceId),
      eq(spaceMembers.userId, userId)
    ))
    .limit(1)

  return result.length > 0
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Check if user is a member of this space
    const isMember = await isSpaceMember(params.id, session.user.id)
    if (!isMember) {
      return NextResponse.json(
        { message: 'Not a member of this space' },
        { status: 403 }
      )
    }

    // Parse query parameters for pagination
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const before = searchParams.get('before')

    // Build query with optional before cursor for pagination
    const whereConditions = [eq(messages.spaceId, params.id)]

    // Add before cursor if provided for pagination
    if (before) {
      whereConditions.push(lt(messages.createdAt, new Date(before)))
    }

    const spaceMessages = await db
      .select({
        id: messages.id,
        spaceId: messages.spaceId,
        userId: messages.userId,
        parentMessageId: messages.parentMessageId,
        content: messages.content,
        messageType: messages.messageType,
        attachments: messages.attachments,
        createdAt: messages.createdAt,
        user: {
          id: users.id,
          displayName: users.displayName,
          username: users.username,
          avatarType: users.avatarType,
          avatarData: users.avatarData,
        },
      })
      .from(messages)
      .innerJoin(users, eq(messages.userId, users.id))
      .where(and(...whereConditions))
      .orderBy(desc(messages.createdAt))
      .limit(Math.min(limit, 100)) // Cap at 100 messages per request

    return NextResponse.json(spaceMessages)
  } catch (error) {
    console.error('Get messages error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

const createMessageSchema = insertMessageSchema.omit({
  spaceId: true,
  userId: true,
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Check if user is a member of this space
    const isMember = await isSpaceMember(params.id, session.user.id)
    if (!isMember) {
      return NextResponse.json(
        { message: 'Not a member of this space' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const messageData = createMessageSchema.parse(body)

    const result = await db
      .insert(messages)
      .values({
        ...messageData,
        spaceId: params.id,
        userId: session.user.id,
      })
      .returning()

    const newMessage = result[0]

    // Get message with user information for response
    const messageWithUser = await db
      .select({
        id: messages.id,
        spaceId: messages.spaceId,
        userId: messages.userId,
        parentMessageId: messages.parentMessageId,
        content: messages.content,
        messageType: messages.messageType,
        attachments: messages.attachments,
        createdAt: messages.createdAt,
        user: {
          id: users.id,
          displayName: users.displayName,
          username: users.username,
          avatarType: users.avatarType,
          avatarData: users.avatarData,
        },
      })
      .from(messages)
      .innerJoin(users, eq(messages.userId, users.id))
      .where(eq(messages.id, newMessage.id))
      .limit(1)

    const messageResult = messageWithUser[0]

    // NOTE: Removed redundant server-side broadcast to prevent message duplication
    // The postgres_changes subscription will automatically handle real-time updates
    // when the message is inserted into the database

    // REMOVED: Broadcast new message to all space members via server-side Supabase Realtime
    // This was causing duplicate messages because clients subscribe to both:
    // 1. postgres_changes (triggered by database INSERT)
    // 2. broadcast events (triggered by this manual broadcast)
    //
    // The postgres_changes subscription is sufficient for real-time message delivery

    return NextResponse.json(messageResult, { status: 201 })
  } catch (error) {
    console.error('Create message error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          message: 'Invalid request data',
          errors: error.errors 
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}