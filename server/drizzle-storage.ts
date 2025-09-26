import { eq, and, sql } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  spaces,
  spaceMembers,
  messages,
  messageReactions,
  notes,
  lessons,
  lessonProgress,
  type User,
  type InsertUser,
  type Space,
  type InsertSpace,
  type Message,
  type InsertMessage,
  type MessageReaction,
  type InsertMessageReaction,
  type Note,
  type InsertNote,
  type Lesson,
  type InsertLesson,
  type LessonProgress,
  type InsertLessonProgress,
  type SpaceMember
} from "@shared/schema";
import type { IStorage } from "./storage";

export class DrizzleStorage implements IStorage {
  constructor() {
    console.log("DrizzleStorage: Database connection initialized");
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      console.log(`DrizzleStorage: Attempting to get user by email: ${email}`);
      
      // Go back to using Drizzle ORM but with better error handling
      const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
      console.log(`DrizzleStorage: Drizzle query successful, result length: ${result?.length || 0}`);
      
      if (!result || result.length === 0) {
        console.log(`DrizzleStorage: No user found for email: ${email}`);
        return undefined;
      }
      
      console.log(`DrizzleStorage: Successfully found user:`, result[0].id);
      return result[0];
    } catch (error) {
      console.error(`DrizzleStorage: Error in getUserByEmail for ${email}:`, error);
      throw new Error(`Error connecting to database: ${error instanceof Error ? error.message : 'fetch failed'}`);
    }
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    try {
      console.log(`DrizzleStorage: Attempting to get user by phone: ${phone}`);
      
      // Go back to using Drizzle ORM but with better error handling
      const result = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
      console.log(`DrizzleStorage: Drizzle query successful, result length: ${result?.length || 0}`);
      
      if (!result || result.length === 0) {
        console.log(`DrizzleStorage: No user found for phone: ${phone}`);
        return undefined;
      }
      
      console.log(`DrizzleStorage: Successfully found user:`, result[0].id);
      return result[0];
    } catch (error) {
      console.error(`DrizzleStorage: Error in getUserByPhone for ${phone}:`, error);
      throw new Error(`Error connecting to database: ${error instanceof Error ? error.message : 'fetch failed'}`);
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      console.log(`DrizzleStorage: Attempting to create user with email: ${insertUser.email}`);
      const result = await db.insert(users).values(insertUser).returning();
      console.log(`DrizzleStorage: Create user query successful, result length: ${result?.length || 0}`);
      
      if (!result || result.length === 0) {
        throw new Error('User creation failed - no result returned');
      }
      
      console.log(`DrizzleStorage: Successfully created user:`, result[0].id);
      return result[0];
    } catch (error) {
      console.error(`DrizzleStorage: Error in createUser:`, error);
      throw new Error(`Error creating user: ${error instanceof Error ? error.message : 'unknown error'}`);
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const result = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return result[0];
  }

  // Spaces
  async getSpace(id: string): Promise<Space | undefined> {
    const result = await db.select().from(spaces).where(eq(spaces.id, id)).limit(1);
    return result[0];
  }

  async getSpaceByInviteCode(code: string): Promise<Space | undefined> {
    const result = await db.select().from(spaces).where(eq(spaces.inviteCode, code)).limit(1);
    return result[0];
  }

  async getUserSpaces(userId: string): Promise<Space[]> {
    const result = await db
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
      })
      .from(spaces)
      .innerJoin(spaceMembers, eq(spaces.id, spaceMembers.spaceId))
      .where(eq(spaceMembers.userId, userId));
    
    return result;
  }

  async createSpace(insertSpace: InsertSpace): Promise<Space> {
    // Generate invite code like MemStorage does
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const spaceData = {
      ...insertSpace,
      inviteCode,
    };
    
    const result = await db.insert(spaces).values(spaceData).returning();
    const space = result[0];
    
    // Add creator as organizer (matching MemStorage behavior)
    await this.addSpaceMember(space.id, insertSpace.createdBy, "organizer");
    
    return space;
  }

  async updateSpace(id: string, updates: Partial<Space>): Promise<Space> {
    const result = await db.update(spaces).set(updates).where(eq(spaces.id, id)).returning();
    return result[0];
  }

  // Space Members
  async getSpaceMembers(spaceId: string): Promise<(SpaceMember & { user: User })[]> {
    const result = await db
      .select({
        id: spaceMembers.id,
        spaceId: spaceMembers.spaceId,
        userId: spaceMembers.userId,
        role: spaceMembers.role,
        notificationLevel: spaceMembers.notificationLevel,
        joinedAt: spaceMembers.joinedAt,
        user: {
          id: users.id,
          email: users.email,
          phone: users.phone,
          displayName: users.displayName,
          username: users.username,
          avatarType: users.avatarType,
          avatarData: users.avatarData,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        }
      })
      .from(spaceMembers)
      .innerJoin(users, eq(spaceMembers.userId, users.id))
      .where(eq(spaceMembers.spaceId, spaceId));

    return result;
  }

  async addSpaceMember(spaceId: string, userId: string, role: string = "member"): Promise<SpaceMember> {
    const insertData = {
      spaceId,
      userId,
      role,
      notificationLevel: "all" as const,
    };
    const result = await db.insert(spaceMembers).values(insertData).returning();
    return result[0];
  }

  async isSpaceMember(spaceId: string, userId: string): Promise<boolean> {
    const result = await db
      .select({ id: spaceMembers.id })
      .from(spaceMembers)
      .where(and(eq(spaceMembers.spaceId, spaceId), eq(spaceMembers.userId, userId)))
      .limit(1);
    
    return result.length > 0;
  }

  async getMemberRole(spaceId: string, userId: string): Promise<string | undefined> {
    const result = await db
      .select({ role: spaceMembers.role })
      .from(spaceMembers)
      .where(and(eq(spaceMembers.spaceId, spaceId), eq(spaceMembers.userId, userId)))
      .limit(1);
    
    return result[0]?.role;
  }

  async updateMemberRole(spaceId: string, userId: string, role: string): Promise<void> {
    await db
      .update(spaceMembers)
      .set({ role })
      .where(and(eq(spaceMembers.spaceId, spaceId), eq(spaceMembers.userId, userId)));
  }

  async updateMemberNotificationLevel(spaceId: string, userId: string, level: string): Promise<void> {
    await db
      .update(spaceMembers)
      .set({ notificationLevel: level })
      .where(and(eq(spaceMembers.spaceId, spaceId), eq(spaceMembers.userId, userId)));
  }

  // Messages
  async getMessages(spaceId: string, limit: number = 50, before?: string): Promise<(Message & { user: User })[]> {
    let query = db
      .select({
        id: messages.id,
        spaceId: messages.spaceId,
        userId: messages.userId,
        parentMessageId: messages.parentMessageId,
        content: messages.content,
        messageType: messages.messageType,
        attachments: messages.attachments,
        createdAt: messages.createdAt,
        user: {
          id: users.id,
          email: users.email,
          phone: users.phone,
          displayName: users.displayName,
          username: users.username,
          avatarType: users.avatarType,
          avatarData: users.avatarData,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        }
      })
      .from(messages)
      .innerJoin(users, eq(messages.userId, users.id))
      .where(eq(messages.spaceId, spaceId))
      .orderBy(messages.createdAt)
      .limit(limit);

    const result = await query;
    return result;
  }

  async getMessage(id: string): Promise<(Message & { user: User }) | undefined> {
    const result = await db
      .select({
        id: messages.id,
        spaceId: messages.spaceId,
        userId: messages.userId,
        parentMessageId: messages.parentMessageId,
        content: messages.content,
        messageType: messages.messageType,
        attachments: messages.attachments,
        createdAt: messages.createdAt,
        user: {
          id: users.id,
          email: users.email,
          phone: users.phone,
          displayName: users.displayName,
          username: users.username,
          avatarType: users.avatarType,
          avatarData: users.avatarData,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        }
      })
      .from(messages)
      .innerJoin(users, eq(messages.userId, users.id))
      .where(eq(messages.id, id))
      .limit(1);

    return result[0];
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const result = await db.insert(messages).values(insertMessage).returning();
    return result[0];
  }

  // Message Reactions
  async getMessageReactions(messageId: string): Promise<(MessageReaction & { user: User })[]> {
    const result = await db
      .select({
        id: messageReactions.id,
        messageId: messageReactions.messageId,
        userId: messageReactions.userId,
        emoji: messageReactions.emoji,
        createdAt: messageReactions.createdAt,
        user: {
          id: users.id,
          email: users.email,
          phone: users.phone,
          displayName: users.displayName,
          username: users.username,
          avatarType: users.avatarType,
          avatarData: users.avatarData,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        }
      })
      .from(messageReactions)
      .innerJoin(users, eq(messageReactions.userId, users.id))
      .where(eq(messageReactions.messageId, messageId));

    return result;
  }

  async addMessageReaction(reaction: InsertMessageReaction): Promise<MessageReaction> {
    const result = await db.insert(messageReactions).values(reaction).returning();
    return result[0];
  }

  async removeMessageReaction(messageId: string, userId: string, emoji: string): Promise<void> {
    await db
      .delete(messageReactions)
      .where(
        and(
          eq(messageReactions.messageId, messageId),
          eq(messageReactions.userId, userId),
          eq(messageReactions.emoji, emoji)
        )
      );
  }

  // Notes
  async getSpaceNotes(spaceId: string): Promise<(Note & { author: User })[]> {
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
          email: users.email,
          phone: users.phone,
          displayName: users.displayName,
          username: users.username,
          avatarType: users.avatarType,
          avatarData: users.avatarData,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        }
      })
      .from(notes)
      .innerJoin(users, eq(notes.authorId, users.id))
      .where(eq(notes.spaceId, spaceId))
      .orderBy(notes.updatedAt);

    return result;
  }

  async getNote(id: string): Promise<(Note & { author: User }) | undefined> {
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
          email: users.email,
          phone: users.phone,
          displayName: users.displayName,
          username: users.username,
          avatarType: users.avatarType,
          avatarData: users.avatarData,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        }
      })
      .from(notes)
      .innerJoin(users, eq(notes.authorId, users.id))
      .where(eq(notes.id, id))
      .limit(1);

    return result[0];
  }

  async createNote(insertNote: InsertNote): Promise<Note> {
    const result = await db.insert(notes).values(insertNote).returning();
    return result[0];
  }

  async updateNote(id: string, updates: Partial<Note>): Promise<Note> {
    const result = await db.update(notes).set(updates).where(eq(notes.id, id)).returning();
    return result[0];
  }

  async deleteNote(id: string): Promise<void> {
    await db.delete(notes).where(eq(notes.id, id));
  }

  // Lessons
  async getSpaceLessons(spaceId: string): Promise<(Lesson & { author: User })[]> {
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
          email: users.email,
          phone: users.phone,
          displayName: users.displayName,
          username: users.username,
          avatarType: users.avatarType,
          avatarData: users.avatarData,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        }
      })
      .from(lessons)
      .innerJoin(users, eq(lessons.authorId, users.id))
      .where(eq(lessons.spaceId, spaceId))
      .orderBy(lessons.updatedAt);

    return result;
  }

  async getLesson(id: string): Promise<(Lesson & { author: User }) | undefined> {
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
          email: users.email,
          phone: users.phone,
          displayName: users.displayName,
          username: users.username,
          avatarType: users.avatarType,
          avatarData: users.avatarData,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        }
      })
      .from(lessons)
      .innerJoin(users, eq(lessons.authorId, users.id))
      .where(eq(lessons.id, id))
      .limit(1);

    return result[0];
  }

  async createLesson(insertLesson: InsertLesson): Promise<Lesson> {
    const result = await db.insert(lessons).values(insertLesson).returning();
    return result[0];
  }

  async updateLesson(id: string, updates: Partial<Lesson>): Promise<Lesson> {
    const result = await db.update(lessons).set(updates).where(eq(lessons.id, id)).returning();
    return result[0];
  }

  async deleteLesson(id: string): Promise<void> {
    await db.delete(lessons).where(eq(lessons.id, id));
  }

  // Lesson Progress
  async getLessonProgress(lessonId: string, userId: string): Promise<LessonProgress[]> {
    const result = await db
      .select()
      .from(lessonProgress)
      .where(and(eq(lessonProgress.lessonId, lessonId), eq(lessonProgress.userId, userId)));

    return result;
  }

  async updateLessonProgress(insertProgress: InsertLessonProgress): Promise<LessonProgress> {
    // Try to find existing progress
    const existing = await db
      .select()
      .from(lessonProgress)
      .where(
        and(
          eq(lessonProgress.lessonId, insertProgress.lessonId),
          eq(lessonProgress.userId, insertProgress.userId),
          eq(lessonProgress.topicIndex, insertProgress.topicIndex)
        )
      )
      .limit(1);

    if (existing[0]) {
      // Update existing progress
      const updates: Partial<LessonProgress> = { 
        completed: insertProgress.completed ?? false,
        completedAt: insertProgress.completed ? new Date() : null
      };
      const result = await db
        .update(lessonProgress)
        .set(updates)
        .where(eq(lessonProgress.id, existing[0].id))
        .returning();
      return result[0];
    } else {
      // Create new progress record
      const insertData: InsertLessonProgress = {
        ...insertProgress,
        completed: insertProgress.completed ?? false,
        completedAt: insertProgress.completed ? new Date() : null,
      };
      const result = await db.insert(lessonProgress).values(insertData).returning();
      return result[0];
    }
  }
}