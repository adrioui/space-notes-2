import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { spaces, spaceMembers, users, insertSpaceSchema } from '@shared/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'
import { nanoid } from 'nanoid'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get spaces where user is a member
    const userSpaces = await db
      .select({
        id: spaces.id,
        name: spaces.name,
        description: spaces.description,
        emoji: spaces.emoji,
        wallpaper: spaces.wallpaper,
        wallpaperUrl: spaces.wallpaperUrl,
        inviteCode: spaces.inviteCode,
        createdBy: spaces.createdBy,
        createdAt: spaces.createdAt,
        updatedAt: spaces.updatedAt,
        role: spaceMembers.role,
        notificationLevel: spaceMembers.notificationLevel,
      })
      .from(spaces)
      .innerJoin(spaceMembers, eq(spaces.id, spaceMembers.spaceId))
      .where(eq(spaceMembers.userId, session.user.id))

    return NextResponse.json(userSpaces)
  } catch (error) {
    console.error('Get spaces error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

const createSpaceSchema = insertSpaceSchema.omit({
  id: true,
  createdBy: true,
  createdAt: true,
  updatedAt: true,
  inviteCode: true,
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const spaceData = createSpaceSchema.parse(body)

    // Generate unique invite code
    const inviteCode = nanoid(8)

    const result = await db
      .insert(spaces)
      .values({
        ...spaceData,
        createdBy: session.user.id,
        inviteCode: inviteCode,
      })
      .returning()

    const newSpace = result[0]

    // Add creator as admin member
    await db.insert(spaceMembers).values({
      spaceId: newSpace.id,
      userId: session.user.id,
      role: 'admin',
      notificationLevel: 'all',
    })

    return NextResponse.json(newSpace, { status: 201 })
  } catch (error) {
    console.error('Create space error:', error)
    
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