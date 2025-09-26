import { 
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
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;

  // Spaces
  getSpace(id: string): Promise<Space | undefined>;
  getSpaceByInviteCode(code: string): Promise<Space | undefined>;
  getUserSpaces(userId: string): Promise<Space[]>;
  createSpace(space: InsertSpace): Promise<Space>;
  updateSpace(id: string, updates: Partial<Space>): Promise<Space>;

  // Space Members
  getSpaceMembers(spaceId: string): Promise<(SpaceMember & { user: User })[]>;
  addSpaceMember(spaceId: string, userId: string, role?: string): Promise<SpaceMember>;
  isSpaceMember(spaceId: string, userId: string): Promise<boolean>;
  getMemberRole(spaceId: string, userId: string): Promise<string | undefined>;
  updateMemberRole(spaceId: string, userId: string, role: string): Promise<void>;
  updateMemberNotificationLevel(spaceId: string, userId: string, level: string): Promise<void>;

  // Messages
  getMessages(spaceId: string, limit?: number, before?: string): Promise<(Message & { user: User })[]>;
  getMessage(id: string): Promise<(Message & { user: User }) | undefined>;
  createMessage(message: InsertMessage): Promise<Message>;
  
  // Message Reactions
  getMessageReactions(messageId: string): Promise<(MessageReaction & { user: User })[]>;
  addMessageReaction(reaction: InsertMessageReaction): Promise<MessageReaction>;
  removeMessageReaction(messageId: string, userId: string, emoji: string): Promise<void>;

  // Notes
  getSpaceNotes(spaceId: string): Promise<(Note & { author: User })[]>;
  getNote(id: string): Promise<(Note & { author: User }) | undefined>;
  createNote(note: InsertNote): Promise<Note>;
  updateNote(id: string, updates: Partial<Note>): Promise<Note>;

  // Lessons
  getSpaceLessons(spaceId: string): Promise<(Lesson & { author: User })[]>;
  getLesson(id: string): Promise<(Lesson & { author: User }) | undefined>;
  createLesson(lesson: InsertLesson): Promise<Lesson>;
  updateLesson(id: string, updates: Partial<Lesson>): Promise<Lesson>;

  // Lesson Progress
  getLessonProgress(lessonId: string, userId: string): Promise<LessonProgress[]>;
  updateLessonProgress(progress: InsertLessonProgress): Promise<LessonProgress>;
}

export class MemStorage implements IStorage {
  private users = new Map<string, User>();
  private spaces = new Map<string, Space>();
  private spaceMembers = new Map<string, SpaceMember>();
  private messages = new Map<string, Message>();
  private messageReactions = new Map<string, MessageReaction>();
  private notes = new Map<string, Note>();
  private lessons = new Map<string, Lesson>();
  private lessonProgress = new Map<string, LessonProgress>();

  constructor() {
    // Initialize with demo data
    this.initializeDemoData();
  }

  private initializeDemoData() {
    // Create demo user
    const demoUser: User = {
      id: "demo-user-1",
      email: "demo@example.com",
      phone: null,
      displayName: "Demo User",
      username: "demouser",
      avatarType: "emoji",
      avatarData: { emoji: "🌟", backgroundColor: "hsl(262.1 83.3% 77.8%)" },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(demoUser.id, demoUser);

    // Create demo space
    const demoSpace: Space = {
      id: "demo-space-1",
      name: "Product Team",
      description: "Main product development space",
      emoji: "🚀",
      wallpaper: "growth",
      wallpaperUrl: null,
      inviteCode: "DEMO123",
      createdBy: demoUser.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.spaces.set(demoSpace.id, demoSpace);

    // Add user to space
    const membership: SpaceMember = {
      id: "demo-member-1",
      spaceId: demoSpace.id,
      userId: demoUser.id,
      role: "organizer",
      notificationLevel: "all",
      joinedAt: new Date(),
    };
    this.spaceMembers.set(membership.id, membership);
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.phone === phone);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      email: insertUser.email ?? null,
      phone: insertUser.phone ?? null,
      avatarType: insertUser.avatarType ?? "emoji",
      avatarData: insertUser.avatarData ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error("User not found");
    
    const updatedUser = { ...user, ...updates, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getSpace(id: string): Promise<Space | undefined> {
    return this.spaces.get(id);
  }

  async getSpaceByInviteCode(code: string): Promise<Space | undefined> {
    return Array.from(this.spaces.values()).find(space => space.inviteCode === code);
  }

  async getUserSpaces(userId: string): Promise<Space[]> {
    const userMemberships = Array.from(this.spaceMembers.values()).filter(
      member => member.userId === userId
    );
    
    return userMemberships
      .map(membership => this.spaces.get(membership.spaceId))
      .filter((space): space is Space => space !== undefined);
  }

  async createSpace(insertSpace: InsertSpace): Promise<Space> {
    const id = randomUUID();
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const space: Space = {
      ...insertSpace,
      id,
      inviteCode,
      description: insertSpace.description ?? null,
      emoji: insertSpace.emoji ?? "🚀",
      wallpaper: insertSpace.wallpaper ?? "neutral",
      wallpaperUrl: insertSpace.wallpaperUrl ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.spaces.set(id, space);
    
    // Add creator as organizer
    await this.addSpaceMember(id, insertSpace.createdBy, "organizer");
    
    return space;
  }

  async updateSpace(id: string, updates: Partial<Space>): Promise<Space> {
    const space = this.spaces.get(id);
    if (!space) throw new Error("Space not found");
    
    const updatedSpace = { ...space, ...updates, updatedAt: new Date() };
    this.spaces.set(id, updatedSpace);
    return updatedSpace;
  }

  async getSpaceMembers(spaceId: string): Promise<(SpaceMember & { user: User })[]> {
    const members = Array.from(this.spaceMembers.values()).filter(
      member => member.spaceId === spaceId
    );
    
    return members.map(member => ({
      ...member,
      user: this.users.get(member.userId)!,
    }));
  }

  async addSpaceMember(spaceId: string, userId: string, role = "member"): Promise<SpaceMember> {
    const id = randomUUID();
    const member: SpaceMember = {
      id,
      spaceId,
      userId,
      role,
      notificationLevel: "all",
      joinedAt: new Date(),
    };
    
    this.spaceMembers.set(id, member);
    return member;
  }

  async isSpaceMember(spaceId: string, userId: string): Promise<boolean> {
    return Array.from(this.spaceMembers.values()).some(
      member => member.spaceId === spaceId && member.userId === userId
    );
  }

  async getMemberRole(spaceId: string, userId: string): Promise<string | undefined> {
    const member = Array.from(this.spaceMembers.values()).find(
      m => m.spaceId === spaceId && m.userId === userId
    );
    return member?.role;
  }

  async updateMemberRole(spaceId: string, userId: string, role: string): Promise<void> {
    const member = Array.from(this.spaceMembers.values()).find(
      m => m.spaceId === spaceId && m.userId === userId
    );
    if (member) {
      member.role = role;
      this.spaceMembers.set(member.id, member);
    }
  }

  async updateMemberNotificationLevel(spaceId: string, userId: string, level: string): Promise<void> {
    const member = Array.from(this.spaceMembers.values()).find(
      m => m.spaceId === spaceId && m.userId === userId
    );
    if (member) {
      member.notificationLevel = level;
      this.spaceMembers.set(member.id, member);
    }
  }

  async getMessages(spaceId: string, limit = 50, before?: string): Promise<(Message & { user: User })[]> {
    let messages = Array.from(this.messages.values())
      .filter(message => message.spaceId === spaceId)
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
    
    if (before) {
      const beforeDate = new Date(before);
      messages = messages.filter(m => m.createdAt! < beforeDate);
    }
    
    messages = messages.slice(0, limit);
    
    return messages.map(message => ({
      ...message,
      user: this.users.get(message.userId)!,
    })).reverse();
  }

  async getMessage(id: string): Promise<(Message & { user: User }) | undefined> {
    const message = this.messages.get(id);
    if (!message) return undefined;
    
    return {
      ...message,
      user: this.users.get(message.userId)!,
    };
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const message: Message = {
      ...insertMessage,
      id,
      parentMessageId: insertMessage.parentMessageId ?? null,
      content: insertMessage.content ?? null,
      messageType: insertMessage.messageType ?? "text",
      attachments: insertMessage.attachments ?? null,
      createdAt: new Date(),
    };
    
    this.messages.set(id, message);
    return message;
  }

  async getMessageReactions(messageId: string): Promise<(MessageReaction & { user: User })[]> {
    const reactions = Array.from(this.messageReactions.values())
      .filter(reaction => reaction.messageId === messageId)
      .sort((a, b) => a.createdAt!.getTime() - b.createdAt!.getTime());
    
    return reactions.map(reaction => ({
      ...reaction,
      user: this.users.get(reaction.userId)!,
    }));
  }

  async addMessageReaction(insertReaction: InsertMessageReaction): Promise<MessageReaction> {
    const id = randomUUID();
    const reaction: MessageReaction = {
      ...insertReaction,
      id,
      createdAt: new Date(),
    };
    
    this.messageReactions.set(id, reaction);
    return reaction;
  }

  async removeMessageReaction(messageId: string, userId: string, emoji: string): Promise<void> {
    const reactionToRemove = Array.from(this.messageReactions.entries()).find(
      ([, reaction]) => 
        reaction.messageId === messageId && 
        reaction.userId === userId && 
        reaction.emoji === emoji
    );
    
    if (reactionToRemove) {
      this.messageReactions.delete(reactionToRemove[0]);
    }
  }

  async getSpaceNotes(spaceId: string): Promise<(Note & { author: User })[]> {
    const notes = Array.from(this.notes.values())
      .filter(note => note.spaceId === spaceId)
      .sort((a, b) => b.updatedAt!.getTime() - a.updatedAt!.getTime());
    
    return notes.map(note => ({
      ...note,
      author: this.users.get(note.authorId)!,
    }));
  }

  async getNote(id: string): Promise<(Note & { author: User }) | undefined> {
    const note = this.notes.get(id);
    if (!note) return undefined;
    
    return {
      ...note,
      author: this.users.get(note.authorId)!,
    };
  }

  async createNote(insertNote: InsertNote): Promise<Note> {
    const id = randomUUID();
    const note: Note = {
      ...insertNote,
      id,
      status: insertNote.status ?? "draft",
      publishedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.notes.set(id, note);
    return note;
  }

  async updateNote(id: string, updates: Partial<Note>): Promise<Note> {
    const note = this.notes.get(id);
    if (!note) throw new Error("Note not found");
    
    const updatedNote = { 
      ...note, 
      ...updates, 
      updatedAt: new Date(),
      publishedAt: updates.status === "published" ? new Date() : note.publishedAt
    };
    
    this.notes.set(id, updatedNote);
    return updatedNote;
  }

  async getSpaceLessons(spaceId: string): Promise<(Lesson & { author: User })[]> {
    const lessons = Array.from(this.lessons.values())
      .filter(lesson => lesson.spaceId === spaceId)
      .sort((a, b) => b.updatedAt!.getTime() - a.updatedAt!.getTime());
    
    return lessons.map(lesson => ({
      ...lesson,
      author: this.users.get(lesson.authorId)!,
    }));
  }

  async getLesson(id: string): Promise<(Lesson & { author: User }) | undefined> {
    const lesson = this.lessons.get(id);
    if (!lesson) return undefined;
    
    return {
      ...lesson,
      author: this.users.get(lesson.authorId)!,
    };
  }

  async createLesson(insertLesson: InsertLesson): Promise<Lesson> {
    const id = randomUUID();
    const lesson: Lesson = {
      ...insertLesson,
      id,
      description: insertLesson.description ?? null,
      status: insertLesson.status ?? "draft",
      publishedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.lessons.set(id, lesson);
    return lesson;
  }

  async updateLesson(id: string, updates: Partial<Lesson>): Promise<Lesson> {
    const lesson = this.lessons.get(id);
    if (!lesson) throw new Error("Lesson not found");
    
    const updatedLesson = { 
      ...lesson, 
      ...updates, 
      updatedAt: new Date(),
      publishedAt: updates.status === "published" ? new Date() : lesson.publishedAt
    };
    
    this.lessons.set(id, updatedLesson);
    return updatedLesson;
  }

  async getLessonProgress(lessonId: string, userId: string): Promise<LessonProgress[]> {
    return Array.from(this.lessonProgress.values()).filter(
      progress => progress.lessonId === lessonId && progress.userId === userId
    );
  }

  async updateLessonProgress(insertProgress: InsertLessonProgress): Promise<LessonProgress> {
    const existing = Array.from(this.lessonProgress.values()).find(
      p => p.lessonId === insertProgress.lessonId && 
           p.userId === insertProgress.userId && 
           p.topicIndex === insertProgress.topicIndex
    );

    if (existing) {
      const updated = { 
        ...existing, 
        completed: insertProgress.completed ?? false,
        completedAt: insertProgress.completed ? new Date() : null
      };
      this.lessonProgress.set(existing.id, updated);
      return updated;
    }

    const id = randomUUID();
    const progress: LessonProgress = {
      ...insertProgress,
      id,
      completed: insertProgress.completed ?? false,
      completedAt: insertProgress.completed ? new Date() : null,
      createdAt: new Date(),
    };
    
    this.lessonProgress.set(id, progress);
    return progress;
  }
}

// Temporarily use MemStorage due to Supabase pooler DNS issues
// import { DrizzleStorage } from "./drizzle-storage";
// export const storage = new DrizzleStorage();

export const storage = new MemStorage();
