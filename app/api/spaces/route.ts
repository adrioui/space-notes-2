import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { spaces, spaceMembers, users, insertSpaceSchema } from '@shared/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'
import { nanoid } from 'nanoid'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          message: 'Authentication required',
          code: 'UNAUTHENTICATED'
        },
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
  createdBy: true,
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          message: 'Authentication required',
          code: 'UNAUTHENTICATED'
        },
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
          errors: error.errors,
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        },
        { status: 400 }
      )
    }

    // Handle database constraint errors
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { message: 'A space with this name already exists' },
          { status: 409 }
        )
      }
    }

    return NextResponse.json(
      { message: 'Failed to create space. Please try again.' },
      { status: 500 }
    )
  }
}