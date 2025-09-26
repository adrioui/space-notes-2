import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { messages, messageReactions, users, insertMessageReactionSchema } from '@shared/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

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

    // Get reactions with user information
    const reactions = await db
      .select({
        id: messageReactions.id,
        messageId: messageReactions.messageId,
        userId: messageReactions.userId,
        emoji: messageReactions.emoji,
        createdAt: messageReactions.createdAt,
        user: {
          id: users.id,
          displayName: users.displayName,
          username: users.username,
          avatarType: users.avatarType,
          avatarData: users.avatarData,
        },
      })
      .from(messageReactions)
      .innerJoin(users, eq(messageReactions.userId, users.id))
      .where(eq(messageReactions.messageId, params.id))

    return NextResponse.json(reactions)
  } catch (error) {
    console.error('Get reactions error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

const createReactionSchema = insertMessageReactionSchema.omit({
  id: true,
  messageId: true,
  userId: true,
  createdAt: true,
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

    const body = await request.json()
    const reactionData = createReactionSchema.parse(body)

    // Check if reaction already exists
    const existingReaction = await db
      .select()
      .from(messageReactions)
      .where(and(
        eq(messageReactions.messageId, params.id),
        eq(messageReactions.userId, session.user.id),
        eq(messageReactions.emoji, reactionData.emoji)
      ))
      .limit(1)

    if (existingReaction.length > 0) {
      return NextResponse.json(
        { message: 'Reaction already exists' },
        { status: 409 }
      )
    }

    const result = await db
      .insert(messageReactions)
      .values({
        ...reactionData,
        messageId: params.id,
        userId: session.user.id,
      })
      .returning()

    const newReaction = result[0]

    // Get reaction with user information for response
    const reactionWithUser = await db
      .select({
        id: messageReactions.id,
        messageId: messageReactions.messageId,
        userId: messageReactions.userId,
        emoji: messageReactions.emoji,
        createdAt: messageReactions.createdAt,
        user: {
          id: users.id,
          displayName: users.displayName,
          username: users.username,
          avatarType: users.avatarType,
          avatarData: users.avatarData,
        },
      })
      .from(messageReactions)
      .innerJoin(users, eq(messageReactions.userId, users.id))
      .where(eq(messageReactions.id, newReaction.id))
      .limit(1)

    const reactionResult = reactionWithUser[0]

    // TODO: Broadcast to space members via Supabase Realtime
    // This will be implemented when we replace WebSocket with Supabase Realtime

    return NextResponse.json(reactionResult, { status: 201 })
  } catch (error) {
    console.error('Create reaction error:', error)
    
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

const deleteReactionSchema = z.object({
  emoji: z.string().min(1, 'Emoji is required'),
})

export async function DELETE(
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

    const body = await request.json()
    const { emoji } = deleteReactionSchema.parse(body)

    await db
      .delete(messageReactions)
      .where(and(
        eq(messageReactions.messageId, params.id),
        eq(messageReactions.userId, session.user.id),
        eq(messageReactions.emoji, emoji)
      ))

    // TODO: Broadcast to space members via Supabase Realtime

    return NextResponse.json({ 
      success: true,
      message: 'Reaction removed successfully'
    })
  } catch (error) {
    console.error('Delete reaction error:', error)
    
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