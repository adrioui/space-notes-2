import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { spaces, spaceMembers } from '@shared/schema'
import { eq, and } from 'drizzle-orm'

export async function POST(
  request: NextRequest,
  { params }: { params: { inviteCode: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Find space by invite code
    const spaceResult = await db
      .select()
      .from(spaces)
      .where(eq(spaces.inviteCode, params.inviteCode))
      .limit(1)

    const space = spaceResult[0]
    
    if (!space) {
      return NextResponse.json(
        { message: 'Invalid invite code' },
        { status: 404 }
      )
    }

    // Check if user is already a member
    const existingMember = await db
      .select()
      .from(spaceMembers)
      .where(and(
        eq(spaceMembers.spaceId, space.id),
        eq(spaceMembers.userId, session.user.id)
      ))
      .limit(1)

    if (existingMember.length > 0) {
      return NextResponse.json(
        { 
          message: 'Already a member of this space',
          space: space
        },
        { status: 200 }
      )
    }

    // Add user as member
    await db.insert(spaceMembers).values({
      spaceId: space.id,
      userId: session.user.id,
      role: 'member',
      notificationLevel: 'all',
    })

    return NextResponse.json({
      success: true,
      message: 'Successfully joined space',
      space: space
    }, { status: 201 })
  } catch (error) {
    console.error('Join space error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}