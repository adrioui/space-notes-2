import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { spaces, spaceMembers, lessons, users, insertLessonSchema } from '@shared/schema'
import { eq, and, desc } from 'drizzle-orm'
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

    // Get space lessons with author information
    const spaceLessons = await db
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
      .where(eq(lessons.spaceId, params.id))
      .orderBy(desc(lessons.updatedAt))

    return NextResponse.json(spaceLessons)
  } catch (error) {
    console.error('Get lessons error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

const createLessonSchema = insertLessonSchema.omit({
  id: true,
  spaceId: true,
  authorId: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
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
    const lessonData = createLessonSchema.parse(body)

    const result = await db
      .insert(lessons)
      .values({
        ...lessonData,
        spaceId: params.id,
        authorId: session.user.id,
        publishedAt: lessonData.status === 'published' ? new Date() : null,
      })
      .returning()

    const newLesson = result[0]

    // Get lesson with author information for response
    const lessonWithAuthor = await db
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
      .where(eq(lessons.id, newLesson.id))
      .limit(1)

    const lessonResult = lessonWithAuthor[0]

    return NextResponse.json(lessonResult, { status: 201 })
  } catch (error) {
    console.error('Create lesson error:', error)
    
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