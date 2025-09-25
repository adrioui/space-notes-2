import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { storage } from "./storage";
import { otpService } from "./otp-service";
import { 
  insertUserSchema, 
  insertSpaceSchema, 
  insertMessageSchema,
  insertNoteSchema,
  insertLessonSchema,
  insertLessonProgressSchema 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // WebSocket server for real-time features - use different path to avoid Vite HMR conflict
  const wss = new WebSocketServer({ 
    server: httpServer,
    path: '/ws' // Separate path for application WebSocket
  });
  const connections = new Map<string, Set<any>>();

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const spaceId = url.searchParams.get('spaceId');
    
    if (spaceId) {
      if (!connections.has(spaceId)) {
        connections.set(spaceId, new Set());
      }
      connections.get(spaceId)!.add(ws);
      
      ws.on('close', () => {
        connections.get(spaceId)?.delete(ws);
      });
    }
  });

  function broadcastToSpace(spaceId: string, data: any) {
    const spaceConnections = connections.get(spaceId);
    if (spaceConnections) {
      const message = JSON.stringify(data);
      spaceConnections.forEach(ws => {
        if (ws.readyState === 1) { // WebSocket.OPEN
          ws.send(message);
        }
      });
    }
  }

  // Auth routes
  app.post("/api/auth/send-otp", async (req, res) => {
    try {
      const { contact } = req.body;
      
      if (!contact) {
        return res.status(400).json({ message: "Contact is required" });
      }

      const result = await otpService.sendOTP(contact);
      
      if (result.success) {
        res.json({ success: true, message: result.message });
      } else {
        res.status(400).json({ message: result.message });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const { contact, otp } = req.body;
      
      if (!contact || !otp) {
        return res.status(400).json({ message: "Contact and OTP are required" });
      }

      // Verify OTP using the OTP service
      const verification = otpService.verifyOTP(contact, otp);
      
      if (!verification.success) {
        return res.status(400).json({ message: verification.message });
      }

      // Check if user exists
      let user = await storage.getUserByEmail(contact) || await storage.getUserByPhone(contact);
      
      if (!user) {
        // New user - return flag for profile setup
        return res.json({ success: true, isNewUser: true, contact });
      }

      // Set session
      req.session.userId = user.id;
      
      res.json({ success: true, user, isNewUser: false });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/auth/complete-profile", async (req, res) => {
    try {
      const validation = insertUserSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid profile data" });
      }

      const user = await storage.createUser(validation.data);
      
      // Set session
      req.session.userId = user.id;
      
      res.json({ success: true, user });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      res.json({ user });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Could not log out" });
      }
      res.json({ success: true });
    });
  });

  // User routes
  app.patch("/api/users/:id", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId || userId !== req.params.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const user = await storage.updateUser(req.params.id, req.body);
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Space routes
  app.get("/api/spaces", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const spaces = await storage.getUserSpaces(userId);
      res.json(spaces);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/spaces", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const validation = insertSpaceSchema.extend({
        createdBy: insertSpaceSchema.shape.createdBy.default(userId)
      }).safeParse({ ...req.body, createdBy: userId });
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid space data" });
      }

      const space = await storage.createSpace(validation.data);
      res.json(space);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/spaces/:id", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const isMember = await storage.isSpaceMember(req.params.id, userId);
      if (!isMember) {
        return res.status(403).json({ message: "Not a member of this space" });
      }

      const space = await storage.getSpace(req.params.id);
      if (!space) {
        return res.status(404).json({ message: "Space not found" });
      }

      res.json(space);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/spaces/join/:inviteCode", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const space = await storage.getSpaceByInviteCode(req.params.inviteCode);
      if (!space) {
        return res.status(404).json({ message: "Invalid invite code" });
      }

      const isMember = await storage.isSpaceMember(space.id, userId);
      if (isMember) {
        return res.status(400).json({ message: "Already a member" });
      }

      await storage.addSpaceMember(space.id, userId);
      res.json({ success: true, space });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/spaces/:id/members", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const isMember = await storage.isSpaceMember(req.params.id, userId);
      if (!isMember) {
        return res.status(403).json({ message: "Not a member of this space" });
      }

      const members = await storage.getSpaceMembers(req.params.id);
      res.json(members);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Message routes
  app.get("/api/spaces/:id/messages", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const isMember = await storage.isSpaceMember(req.params.id, userId);
      if (!isMember) {
        return res.status(403).json({ message: "Not a member of this space" });
      }

      const limit = parseInt(req.query.limit as string) || 50;
      const before = req.query.before as string;

      const messages = await storage.getMessages(req.params.id, limit, before);
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/spaces/:id/messages", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const isMember = await storage.isSpaceMember(req.params.id, userId);
      if (!isMember) {
        return res.status(403).json({ message: "Not a member of this space" });
      }

      const validation = insertMessageSchema.extend({
        spaceId: insertMessageSchema.shape.spaceId.default(req.params.id),
        userId: insertMessageSchema.shape.userId.default(userId)
      }).safeParse({ ...req.body, spaceId: req.params.id, userId });

      if (!validation.success) {
        return res.status(400).json({ message: "Invalid message data" });
      }

      const message = await storage.createMessage(validation.data);
      const user = await storage.getUser(userId);
      
      const messageWithUser = { ...message, user };
      
      // Broadcast to all space members
      broadcastToSpace(req.params.id, {
        type: 'new_message',
        data: messageWithUser
      });

      res.json(messageWithUser);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Notes routes
  app.get("/api/spaces/:id/notes", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const isMember = await storage.isSpaceMember(req.params.id, userId);
      if (!isMember) {
        return res.status(403).json({ message: "Not a member of this space" });
      }

      const notes = await storage.getSpaceNotes(req.params.id);
      res.json(notes);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/spaces/:id/notes", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const isMember = await storage.isSpaceMember(req.params.id, userId);
      if (!isMember) {
        return res.status(403).json({ message: "Not a member of this space" });
      }

      const validation = insertNoteSchema.extend({
        spaceId: insertNoteSchema.shape.spaceId.default(req.params.id),
        authorId: insertNoteSchema.shape.authorId.default(userId)
      }).safeParse({ ...req.body, spaceId: req.params.id, authorId: userId });

      if (!validation.success) {
        return res.status(400).json({ message: "Invalid note data" });
      }

      const note = await storage.createNote(validation.data);
      res.json(note);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/notes/:id", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const note = await storage.getNote(req.params.id);
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }

      const isMember = await storage.isSpaceMember(note.spaceId, userId);
      if (!isMember) {
        return res.status(403).json({ message: "Not a member of this space" });
      }

      res.json(note);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/notes/:id", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const note = await storage.getNote(req.params.id);
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }

      if (note.authorId !== userId) {
        return res.status(403).json({ message: "Not authorized to edit this note" });
      }

      const updatedNote = await storage.updateNote(req.params.id, req.body);
      
      // If publishing with notification, send system message
      if (req.body.status === "published" && req.body.notify) {
        const systemMessage = await storage.createMessage({
          spaceId: note.spaceId,
          userId: userId,
          content: `📝 New note "${updatedNote.title}" published by ${note.author.displayName}`,
          messageType: "system"
        });
        
        broadcastToSpace(note.spaceId, {
          type: 'new_message',
          data: { ...systemMessage, user: note.author }
        });
      }

      res.json(updatedNote);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Lessons routes
  app.get("/api/spaces/:id/lessons", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const isMember = await storage.isSpaceMember(req.params.id, userId);
      if (!isMember) {
        return res.status(403).json({ message: "Not a member of this space" });
      }

      const lessons = await storage.getSpaceLessons(req.params.id);
      res.json(lessons);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/spaces/:id/lessons", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const isMember = await storage.isSpaceMember(req.params.id, userId);
      if (!isMember) {
        return res.status(403).json({ message: "Not a member of this space" });
      }

      const validation = insertLessonSchema.extend({
        spaceId: insertLessonSchema.shape.spaceId.default(req.params.id),
        authorId: insertLessonSchema.shape.authorId.default(userId)
      }).safeParse({ ...req.body, spaceId: req.params.id, authorId: userId });

      if (!validation.success) {
        return res.status(400).json({ message: "Invalid lesson data" });
      }

      const lesson = await storage.createLesson(validation.data);
      res.json(lesson);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/lessons/:id", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const lesson = await storage.getLesson(req.params.id);
      if (!lesson) {
        return res.status(404).json({ message: "Lesson not found" });
      }

      if (lesson.authorId !== userId) {
        return res.status(403).json({ message: "Not authorized to edit this lesson" });
      }

      const updatedLesson = await storage.updateLesson(req.params.id, req.body);
      
      // If publishing with notification, send system message
      if (req.body.status === "published" && req.body.notify) {
        const systemMessage = await storage.createMessage({
          spaceId: lesson.spaceId,
          userId: userId,
          content: `🎓 New lesson "${updatedLesson.title}" published by ${lesson.author.displayName}`,
          messageType: "system"
        });
        
        broadcastToSpace(lesson.spaceId, {
          type: 'new_message',
          data: { ...systemMessage, user: lesson.author }
        });
      }

      res.json(updatedLesson);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Lesson progress routes
  app.get("/api/lessons/:id/progress", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const progress = await storage.getLessonProgress(req.params.id, userId);
      res.json(progress);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/lessons/:id/progress", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const validation = insertLessonProgressSchema.extend({
        lessonId: insertLessonProgressSchema.shape.lessonId.default(req.params.id),
        userId: insertLessonProgressSchema.shape.userId.default(userId)
      }).safeParse({ ...req.body, lessonId: req.params.id, userId });

      if (!validation.success) {
        return res.status(400).json({ message: "Invalid progress data" });
      }

      const progress = await storage.updateLessonProgress(validation.data);
      res.json(progress);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  return httpServer;
}
