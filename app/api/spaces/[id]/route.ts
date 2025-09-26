import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { spaces, spaceMembers, users, insertSpaceSchema } from '@shared/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

const updateSpaceSchema = insertSpaceSchema.partial().omit({
  id: true,
  createdBy: true,
  createdAt: true,
  updatedAt: true,
  inviteCode: true,
})

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

async function isSpaceAdmin(spaceId: string, userId: string): Promise<boolean> {
  const result = await db
    .select()
    .from(spaceMembers)
    .where(and(
      eq(spaceMembers.spaceId, spaceId),
      eq(spaceMembers.userId, userId),
      eq(spaceMembers.role, 'admin')
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

    const result = await db
      .select()
      .from(spaces)
      .where(eq(spaces.id, params.id))
      .limit(1)

    const space = result[0]
    
    if (!space) {
      return NextResponse.json(
        { message: 'Space not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(space)
  } catch (error) {
    console.error('Get space error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
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

    // Check if user is an admin of this space
    const isAdmin = await isSpaceAdmin(params.id, session.user.id)
    if (!isAdmin) {
      return NextResponse.json(
        { message: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const spaceData = updateSpaceSchema.parse(body)

    const result = await db
      .update(spaces)
      .set({
        ...spaceData,
        updatedAt: new Date(),
      })
      .where(eq(spaces.id, params.id))
      .returning()

    const updatedSpace = result[0]
    
    if (!updatedSpace) {
      return NextResponse.json(
        { message: 'Space not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(updatedSpace)
  } catch (error) {
    console.error('Update space error:', error)
    
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

    // Check if user is the owner of this space
    const result = await db
      .select()
      .from(spaces)
      .where(and(
        eq(spaces.id, params.id),
        eq(spaces.createdBy, session.user.id)
      ))
      .limit(1)

    const space = result[0]
    
    if (!space) {
      return NextResponse.json(
        { message: 'Space not found or insufficient permissions' },
        { status: 404 }
      )
    }

    await db.delete(spaces).where(eq(spaces.id, params.id))

    return NextResponse.json({ message: 'Space deleted successfully' })
  } catch (error) {
    console.error('Delete space error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}