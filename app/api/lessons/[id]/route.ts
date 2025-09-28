import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { lessons, spaceMembers, users, insertLessonSchema } from '@shared/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

const updateLessonSchema = insertLessonSchema.partial().omit({
  spaceId: true,
  authorId: true,
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

    // Get lesson with author information
    const result = await db
      .select({
        id: lessons.id,
        spaceId: lessons.spaceId,
        authorId: lessons.authorId,
        title: lessons.title,
        description: lessons.description,
        topics: lessons.topics,
        status: lessons.status,
        publishedAt: lessons.publishedAt,
        createdAt: lessons.createdAt,
        updatedAt: lessons.updatedAt,
        author: {
          id: users.id,
          displayName: users.displayName,
          username: users.username,
          avatarType: users.avatarType,
          avatarData: users.avatarData,
        },
      })
      .from(lessons)
      .innerJoin(users, eq(lessons.authorId, users.id))
      .where(eq(lessons.id, params.id))
      .limit(1)

    const lesson = result[0]
    
    if (!lesson) {
      return NextResponse.json(
        { message: 'Lesson not found' },
        { status: 404 }
      )
    }

    // Check if user is a member of the space this lesson belongs to
    const isMember = await isSpaceMember(lesson.spaceId, session.user.id)
    if (!isMember) {
      return NextResponse.json(
        { message: 'Not a member of this space' },
        { status: 403 }
      )
    }

    return NextResponse.json(lesson)
  } catch (error) {
    console.error('Get lesson error:', error)
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

    // Get the lesson to check permissions
    const lessonResult = await db
      .select()
      .from(lessons)
      .where(eq(lessons.id, params.id))
      .limit(1)

    const lesson = lessonResult[0]
    
    if (!lesson) {
      return NextResponse.json(
        { message: 'Lesson not found' },
        { status: 404 }
      )
    }

    // Check if user is the author or a member of the space
    const isMember = await isSpaceMember(lesson.spaceId, session.user.id)
    if (!isMember) {
      return NextResponse.json(
        { message: 'Not a member of this space' },
        { status: 403 }
      )
    }

    // Only the author can edit the lesson
    if (lesson.authorId !== session.user.id) {
      return NextResponse.json(
        { message: 'Only the author can edit this lesson' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const lessonData = updateLessonSchema.parse(body)

    // Update publishedAt if status is being changed to published
    const updateData = {
      ...lessonData,
      updatedAt: new Date(),
      ...(lessonData.status === 'published' && lesson.status !== 'published' 
        ? { publishedAt: new Date() } 
        : {}
      ),
    }

    const result = await db
      .update(lessons)
      .set(updateData)
      .where(eq(lessons.id, params.id))
      .returning()

    const updatedLesson = result[0]

    return NextResponse.json(updatedLesson)
  } catch (error) {
    console.error('Update lesson error:', error)
    
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

    // Get the lesson to check permissions
    const lessonResult = await db
      .select()
      .from(lessons)
      .where(eq(lessons.id, params.id))
      .limit(1)

    const lesson = lessonResult[0]
    
    if (!lesson) {
      return NextResponse.json(
        { message: 'Lesson not found' },
        { status: 404 }
      )
    }

    // Only the author can delete the lesson
    if (lesson.authorId !== session.user.id) {
      return NextResponse.json(
        { message: 'Only the author can delete this lesson' },
        { status: 403 }
      )
    }

    await db.delete(lessons).where(eq(lessons.id, params.id))

    return NextResponse.json({ message: 'Lesson deleted successfully' })
  } catch (error) {
    console.error('Delete lesson error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}