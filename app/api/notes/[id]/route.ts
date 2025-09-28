import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptionsBypass } from '@/lib/auth-bypass'
import { db } from '@/lib/db'
import { notes, spaceMembers, users, insertNoteSchema } from '@shared/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

const updateNoteSchema = insertNoteSchema.partial().omit({
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
    const session = await getServerSession(authOptionsBypass)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get note with author information
    const result = await db
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
      .where(eq(notes.id, params.id))
      .limit(1)

    const note = result[0]
    
    if (!note) {
      return NextResponse.json(
        { message: 'Note not found' },
        { status: 404 }
      )
    }

    // Check if user is a member of the space this note belongs to
    const isMember = await isSpaceMember(note.spaceId, session.user.id)
    if (!isMember) {
      return NextResponse.json(
        { message: 'Not a member of this space' },
        { status: 403 }
      )
    }

    return NextResponse.json(note)
  } catch (error) {
    console.error('Get note error:', error)
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
    const session = await getServerSession(authOptionsBypass)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get the note to check permissions
    const noteResult = await db
      .select()
      .from(notes)
      .where(eq(notes.id, params.id))
      .limit(1)

    const note = noteResult[0]
    
    if (!note) {
      return NextResponse.json(
        { message: 'Note not found' },
        { status: 404 }
      )
    }

    // Check if user is the author or a member of the space
    const isMember = await isSpaceMember(note.spaceId, session.user.id)
    if (!isMember) {
      return NextResponse.json(
        { message: 'Not a member of this space' },
        { status: 403 }
      )
    }

    // Only the author can edit the note
    if (note.authorId !== session.user.id) {
      return NextResponse.json(
        { message: 'Only the author can edit this note' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const noteData = updateNoteSchema.parse(body)

    // Update publishedAt if status is being changed to published
    const updateData = {
      ...noteData,
      updatedAt: new Date(),
      ...(noteData.status === 'published' && note.status !== 'published' 
        ? { publishedAt: new Date() } 
        : {}
      ),
    }

    const result = await db
      .update(notes)
      .set(updateData)
      .where(eq(notes.id, params.id))
      .returning()

    const updatedNote = result[0]

    return NextResponse.json(updatedNote)
  } catch (error) {
    console.error('Update note error:', error)
    
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
    const session = await getServerSession(authOptionsBypass)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get the note to check permissions
    const noteResult = await db
      .select()
      .from(notes)
      .where(eq(notes.id, params.id))
      .limit(1)

    const note = noteResult[0]
    
    if (!note) {
      return NextResponse.json(
        { message: 'Note not found' },
        { status: 404 }
      )
    }

    // Only the author can delete the note
    if (note.authorId !== session.user.id) {
      return NextResponse.json(
        { message: 'Only the author can delete this note' },
        { status: 403 }
      )
    }

    await db.delete(notes).where(eq(notes.id, params.id))

    return NextResponse.json({ message: 'Note deleted successfully' })
  } catch (error) {
    console.error('Delete note error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}