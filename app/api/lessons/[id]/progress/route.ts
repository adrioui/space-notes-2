import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { lessons, lessonProgress, spaceMembers, insertLessonProgressSchema } from '@shared/schema'
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

    // Check if user is a member of the space this lesson belongs to
    const isMember = await isSpaceMember(lesson.spaceId, session.user.id)
    if (!isMember) {
      return NextResponse.json(
        { message: 'Not a member of this space' },
        { status: 403 }
      )
    }

    // Get user's progress for this lesson
    const progressResult = await db
      .select()
      .from(lessonProgress)
      .where(and(
        eq(lessonProgress.lessonId, params.id),
        eq(lessonProgress.userId, session.user.id)
      ))
      .limit(1)

    const progress = progressResult[0]
    
    if (!progress) {
      // Return default progress if none exists
      return NextResponse.json({
        lessonId: params.id,
        userId: session.user.id,
        completedTopics: [],
        progress: 0,
        lastAccessedAt: null,
        completedAt: null,
      })
    }

    return NextResponse.json(progress)
  } catch (error) {
    console.error('Get lesson progress error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

const createProgressSchema = insertLessonProgressSchema.omit({
  id: true,
  lessonId: true,
  userId: true,
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

    // Check if user is a member of the space this lesson belongs to
    const isMember = await isSpaceMember(lesson.spaceId, session.user.id)
    if (!isMember) {
      return NextResponse.json(
        { message: 'Not a member of this space' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const progressData = createProgressSchema.parse(body)

    // Check if progress already exists
    const existingProgress = await db
      .select()
      .from(lessonProgress)
      .where(and(
        eq(lessonProgress.lessonId, params.id),
        eq(lessonProgress.userId, session.user.id)
      ))
      .limit(1)

    let result
    if (existingProgress.length > 0) {
      // Update existing progress
      result = await db
        .update(lessonProgress)
        .set({
          ...progressData,
          lastAccessedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(and(
          eq(lessonProgress.lessonId, params.id),
          eq(lessonProgress.userId, session.user.id)
        ))
        .returning()
    } else {
      // Create new progress
      result = await db
        .insert(lessonProgress)
        .values({
          ...progressData,
          lessonId: params.id,
          userId: session.user.id,
          lastAccessedAt: new Date(),
        })
        .returning()
    }

    const updatedProgress = result[0]

    return NextResponse.json(updatedProgress, { 
      status: existingProgress.length > 0 ? 200 : 201 
    })
  } catch (error) {
    console.error('Update lesson progress error:', error)
    
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