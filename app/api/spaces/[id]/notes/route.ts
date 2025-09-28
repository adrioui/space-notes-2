import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptionsBypass } from '@/lib/auth-bypass'
import { db } from '@/lib/db'
import { spaces, spaceMembers, notes, users, insertNoteSchema } from '@shared/schema'
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
    const session = await getServerSession(authOptionsBypass)
    
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

    // Get space notes with author information
    const spaceNotes = await db
      .select({
        id: notes.id,
        spaceId: notes.spaceId,
        authorId: notes.authorId,
        title: notes.title,
        blocks: notes.blocks,
        status: notes.status,
        publishedAt: notes.publishedAt,
        createdAt: notes.createdAt,
        updatedAt: notes.updatedAt,
        author: {
          id: users.id,
          displayName: users.displayName,
          username: users.username,
          avatarType: users.avatarType,
          avatarData: users.avatarData,
        },
      })
      .from(notes)
      .innerJoin(users, eq(notes.authorId, users.id))
      .where(eq(notes.spaceId, params.id))
      .orderBy(desc(notes.updatedAt))

    return NextResponse.json(spaceNotes)
  } catch (error) {
    console.error('Get notes error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

const createNoteSchema = insertNoteSchema.omit({
  spaceId: true,
  authorId: true,
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptionsBypass)
    
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
    const noteData = createNoteSchema.parse(body)

    const result = await db
      .insert(notes)
      .values({
        ...noteData,
        spaceId: params.id,
        authorId: session.user.id,
        publishedAt: noteData.status === 'published' ? new Date() : null,
      })
      .returning()

    const newNote = result[0]

    // Get note with author information for response
    const noteWithAuthor = await db
      .select({
        id: notes.id,
        spaceId: notes.spaceId,
        authorId: notes.authorId,
        title: notes.title,
        blocks: notes.blocks,
        status: notes.status,
        publishedAt: notes.publishedAt,
        createdAt: notes.createdAt,
        updatedAt: notes.updatedAt,
        author: {
          id: users.id,
          displayName: users.displayName,
          username: users.username,
          avatarType: users.avatarType,
          avatarData: users.avatarData,
        },
      })
      .from(notes)
      .innerJoin(users, eq(notes.authorId, users.id))
      .where(eq(notes.id, newNote.id))
      .limit(1)

    const noteResult = noteWithAuthor[0]

    return NextResponse.json(noteResult, { status: 201 })
  } catch (error) {
    console.error('Create note error:', error)
    
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