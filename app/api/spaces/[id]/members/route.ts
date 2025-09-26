import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { spaceMembers, users } from '@shared/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

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

    // Get space members with user information
    const members = await db
      .select({
        id: spaceMembers.id,
        spaceId: spaceMembers.spaceId,
        userId: spaceMembers.userId,
        role: spaceMembers.role,
        notificationLevel: spaceMembers.notificationLevel,
        joinedAt: spaceMembers.joinedAt,
        user: {
          id: users.id,
          displayName: users.displayName,
          username: users.username,
          avatarType: users.avatarType,
          avatarData: users.avatarData,
        },
      })
      .from(spaceMembers)
      .innerJoin(users, eq(spaceMembers.userId, users.id))
      .where(eq(spaceMembers.spaceId, params.id))

    return NextResponse.json(members)
  } catch (error) {
    console.error('Get space members error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}