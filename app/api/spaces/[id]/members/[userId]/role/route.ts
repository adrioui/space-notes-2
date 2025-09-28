import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptionsBypass } from '@/lib/auth-bypass'
import { db } from '@/lib/db'
import { spaceMembers } from '@shared/schema'
import { eq, and } from 'drizzle-orm'

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
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const session = await getServerSession(authOptionsBypass)

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Check if current user is a member of this space
    const isMember = await isSpaceMember(params.id, session.user.id)
    if (!isMember) {
      return NextResponse.json(
        { message: 'Not a member of this space' },
        { status: 403 }
      )
    }

    // Get the role of the specified user
    const result = await db
      .select({
        role: spaceMembers.role,
        notificationLevel: spaceMembers.notificationLevel,
        joinedAt: spaceMembers.joinedAt,
      })
      .from(spaceMembers)
      .where(and(
        eq(spaceMembers.spaceId, params.id),
        eq(spaceMembers.userId, params.userId)
      ))
      .limit(1)

    const memberInfo = result[0]
    
    if (!memberInfo) {
      return NextResponse.json(
        { message: 'User is not a member of this space' },
        { status: 404 }
      )
    }

    return NextResponse.json(memberInfo)
  } catch (error) {
    console.error('Get member role error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}