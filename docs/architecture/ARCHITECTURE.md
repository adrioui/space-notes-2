# Architecture Documentation

This document provides a comprehensive overview of the system architecture for the space-notes-2 project, including runtime topology, key components, data model, core application flows, security model, performance characteristics, configuration, observability, and roadmap.

Table of Contents
- Executive Summary
- High-Level Architecture
- Runtime Topology
- Components
- Data Model
- Core Flows
- Security Model
- Performance and Scalability
- Configuration and Environments
- Observability and Error Handling
- Development and Testing
- Deployment Considerations
- Roadmap and Technical Debt
- Glossary

Executive Summary
- Paradigm: Hybrid architecture
  - Next.js (App Router) for API routes and server-side logic
  - Express server (Node) for a separate server runtime, session-based auth for the “client” app, and OTP flow
  - Supabase used for Realtime (ws), Storage, and Postgres (via Drizzle ORM)
- Data Access: Drizzle ORM with shared, type-safe schema (shared/schema.ts)
- Authentication:
  - NextAuth with DrizzleAdapter for Next.js side
  - Custom OTP service (email/SMS) on Express side with express-session
- Realtime:
  - Supabase Realtime channels for messages, presence, and broadcast
- Storage:
  - Supabase Storage buckets for avatars, attachments, wallpapers
- Status: Functional, with production-readiness improvements identified (migrations, RLS, unified auth, removal of MemStorage)

High-Level Architecture
The system is composed of three primary layers:

1) Presentation/API layer
   - Next.js App Router API endpoints in app/api/**.
   - Express server providing REST endpoints for OTP auth and a session-based flow (server/routes.ts).

2) Domain/Services layer
   - Realtime manager for channels, presence, and broadcasts (src/lib/supabase-realtime.ts).
   - Storage manager encapsulating file upload and URL handling (src/lib/supabase-storage.ts).
   - OTP services (src/lib/otp-service.ts and server/otp-service.ts) for email/SMS.

3) Data layer
   - Drizzle ORM mapping to Supabase Postgres using shared/schema.ts for all entities.
   - MemStorage fallback for development and when DB connectivity faces issues (server/storage.ts).
   - DrizzleStorage for Postgres access from the Express server (server/drizzle-storage.ts), currently disabled due to pooler DNS issues.

Runtime Topology
ASCII overview of deployed components:

+----------------------+        +-------------------------+        +---------------------------+
|      Next.js         |        |        Express          |        |         Supabase          |
|  (App Router APIs)   |        |  (OTP + session auth)   |        |  (Postgres + Realtime +   |
|                      |  REST  |                         |  WS    |   Storage)                |
| - app/api/*          +------->+ - /api/auth/send-otp    +------->+ - Realtime channels       |
| - getServerSession() |        | - /api/auth/verify-otp  |        | - Postgres (Drizzle ORM)  |
| - uses Drizzle (neon)|        | - routes for user ops   |        | - Storage (buckets)       |
+----------------------+        +-------------------------+        +---------------------------+
            |                                 |                               ^
            |                                 |                               |
            v                                 v                               |
     src/lib/* services                server/* services                      |
            \________________________    /                                     |
                                     \__/                                Realtime updates
                                         via @supabase/supabase-js

Key processes:
- Next.js handles core resource APIs (users, spaces, notes, lessons, messages) using Drizzle and NextAuth for session/user context.
- Express handles OTP initiation and verification and uses express-session to store userId for the “client” app.
- Supabase provides realtime updates and presence states and stores user-uploaded assets.

Components
1) Next.js Application (App Router)
- API routes under app/api/** for:
  - Users: app/api/users/me, app/api/users/[id]
  - Spaces: app/api/spaces, app/api/spaces/[id], joins, members, messages, notes, lessons, progress
- Authentication integration:
  - NextAuth config in src/lib/auth.ts using DrizzleAdapter
  - getServerSession(authOptions) used in API routes to authorize requests
- Database access layer:
  - src/lib/db.ts uses drizzle-orm/neon-http + @neondatabase/serverless (serverless-friendly)
- Supabase client:
  - src/lib/supabase.ts creates client with realtime params and persistSession disabled (NextAuth manages sessions)

2) Express Server
- server/index.ts bootstraps Express with:
  - express-session (SESSION_SECRET required)
  - routes registered via server/routes.ts
- server/routes.ts:
  - Auth endpoints: /api/auth/send-otp, /api/auth/verify-otp, /api/auth/complete-profile, /api/auth/logout
  - User endpoints for profile setup/updates
- server/storage.ts:
  - IStorage interface with MemStorage in use
  - DrizzleStorage exists (server/drizzle-storage.ts) but is currently disabled due to DNS issues connecting via Supabase pooler
- OTP:
  - server/otp-service.ts implements sendOTP/verifyOTP with in-memory storage for dev, supports email or Twilio SMS

3) Supabase Services
- Realtime:
  - src/lib/supabase-realtime.ts provides SupabaseRealtimeManager with:
    - subscribeToSpaceMessages (Postgres changes on INSERT/UPDATE with filters)
    - subscribeToSpacePresence (presence sync/join/leave; per-user presence keys)
    - broadcastToSpace (broadcast events to a space’s channel)
- Storage:
  - src/lib/supabase-storage.ts provides SupabaseStorageManager for:
    - uploadAvatar, uploadAttachment, uploadWallpaper
    - createSignedUrl, getFileUrl, deleteFile
- Postgres:
  - Drizzle ORM maps to Supabase Postgres using shared/schema.ts (tables include users, spaces, space_members, messages, message_reactions, notes, lessons, lesson_progress, NextAuth tables: accounts, sessions, verificationTokens)

4) Shared Schema (Drizzle)
- shared/schema.ts defines DB tables, zod-based insert schemas, and types, ensuring type-safety across both Next.js and Express environments.

Data Model
Core Entities (see shared/schema.ts):
- users: id, email, phone, displayName, username, avatarType, avatarData, emailVerified, image, createdAt, updatedAt
- spaces: id, name, description, emoji, wallpaper, wallpaperUrl, inviteCode, createdBy
- space_members: id, spaceId, userId, role, notificationLevel, joinedAt
- messages: id, spaceId, userId, parentMessageId, content, messageType, attachments, createdAt
- message_reactions: id, messageId, userId, emoji, createdAt
- notes: id, spaceId, authorId, title, blocks, status, publishedAt, createdAt, updatedAt
- lessons: id, spaceId, authorId, title, description, topics, status, publishedAt, createdAt, updatedAt
- lesson_progress: id, lessonId, userId, topicIndex, completed, completedAt, createdAt
- NextAuth: accounts (compound PK on provider/providerAccountId), sessions (PK sessionToken), verificationTokens (compound PK on identifier/token)

Relationships:
- spaces.createdBy -> users.id
- space_members.spaceId -> spaces.id; space_members.userId -> users.id
- messages.spaceId -> spaces.id; messages.userId -> users.id
- message_reactions.messageId -> messages.id; .userId -> users.id
- notes.spaceId -> spaces.id; notes.authorId -> users.id
- lessons.spaceId -> spaces.id; lessons.authorId -> users.id
- lesson_progress.lessonId -> lessons.id; .userId -> users.id

Core Flows
1) Authentication (Next.js + NextAuth)
- NextAuth configured in src/lib/auth.ts with DrizzleAdapter(db)
- Session strategy: database (sessions table)
- App routes call getServerSession(authOptions) to authorize access
- Handlers check session.user.id and validate membership (e.g., isSpaceMember) before returning data

2) OTP Flow (Express)
- POST /api/auth/send-otp
  - Validates contact, generates OTP, sends via email/SMS
  - Stores OTP in memory (dev) with expiry and attempt limits
- POST /api/auth/verify-otp
  - Validates submitted OTP, handles attempts/expiry
  - If user exists, sets req.session.userId and returns user; else returns flag to complete profile
- POST /api/auth/complete-profile
  - Validates profile data, creates user in storage, sets session (req.session.userId)
- POST /api/auth/logout
  - Clears session (client-side signOut handled by NextAuth on the Next.js side)

3) Messages and Reactions (Next.js APIs + Realtime)
- Message create:
  - app/api/spaces/[id]/messages/route.ts validates session and space membership
  - Inserts message via Drizzle; TODO markers indicate future Realtime broadcasts
- Reactions:
  - app/api/messages/[id]/reactions/route.ts adds/removes reactions; TODO markers for Realtime notifications
- Realtime subscription (client):
  - subscribeToSpaceMessages(): Postgres change feeds with filter space_id=eq.${spaceId}
  - subscribeToSpacePresence(): presence tracking with channel.presenceState()

4) Notes and Lessons
- CRUD endpoints for notes and lessons with author information join
- Lesson progress tracked per user/topic
- Membership checks for all resource-accessing endpoints

5) Storage Flows
- Avatars:
  - uploadAvatar(file, userId) => store in avatars bucket at ${userId}/${fileName}; returns public URL
- Attachments:
  - uploadAttachment(file, spaceId, messageId) => attachments bucket at ${spaceId}/${messageId}/${fileName}
- Wallpapers:
  - uploadWallpaper(file, spaceId) => wallpapers bucket at ${spaceId}/${fileName}
- Signed URLs available for private access if needed

Security Model
- Authentication
  - NextAuth (database session strategy) for Next.js APIs
  - Express: express-session for OTP-based auth for the separate “client” runtime
- Authorization and tenancy
  - getServerSession() used in API routes; checks session.user.id presence
  - Per-space authorization via isSpaceMember checks before data access
- Data Security
  - Drizzle queries restrict rows based on membership and ownership checks
  - Supabase Storage: public URL usage by default; signed URL support available
- Recommended hardening (in progress)
  - Storage RLS policies for buckets (avatars, attachments, wallpapers)
  - Centralized permission checks and reusable guards
  - Remove in-memory OTP in production (use Redis/DB-backed store)
- Secrets
  - SESSION_SECRET required for Express session middleware
  - SUPABASE_URL / SUPABASE_ANON_KEY used for realtime and storage access
  - DATABASE_URL or SUPABASE_DATABASE_URL for DB connectivity

Performance and Scalability
- Database
  - Drizzle queries use explicit selects and joins; index coverage recommended on frequent filters (spaceId, createdAt, userId)
  - postgres-js (server/db.ts) and neon-http (src/lib/db.ts) used appropriately per runtime
- Realtime
  - Rate limiting configured: eventsPerSecond: 10
  - Filtered subscriptions reduce event volume (filter: space_id=eq.${spaceId})
- Scaling considerations
  - Express uses in-memory OTP store (non-scalable); replace with Redis for horizontal scaling
  - Ensure connection pool sizes are tuned; postgres-js configured with max and timeouts
  - Consider CDN for storage asset distribution and size-based image transformations
- Caching
  - Query caching via React Query on the client (client side code)
  - Consider API-level caching where safe for read-heavy endpoints

Configuration and Environments
- Environment Variables
  - SUPABASE_URL, SUPABASE_ANON_KEY
  - DATABASE_URL, SUPABASE_DATABASE_URL (prefer SUPABASE_DATABASE_URL for pooler quirks)
  - SESSION_SECRET
  - EMAIL_USER, EMAIL_PASS (OTP via email)
  - TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER (OTP via SMS)
- Client-side (Vite)
  - VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
- Initialization
  - src/lib/supabase.ts sets persistSession: false; realtime params set
  - client/src/lib/supabase.ts warns if env vars are missing and creates client with fallback strings (improve by failing fast in prod)
- Drizzle config
  - drizzle.config.ts points to shared/schema.ts and migrations output folder

Observability and Error Handling
- Logging
  - DrizzleStorage and server storage/methods include debug logs
  - Console logging for realtime subscription states and presence changes
- Error paths
  - API routes consistently return 401 for missing session, 403 for membership violations, 400 for invalid input
  - OTP service enforces expiry and attempt limits
- Recommended improvements
  - Centralized error handler for API routes
  - Structured logging (pino/winston) with request IDs
  - Monitoring with Sentry or similar for client and server
  - Health endpoints and probes for Express server
  - Realtime reconnection/backoff strategies

Development and Testing
- Test utilities
  - client/src/test/mocks/handlers.ts mocks auth-related endpoints
  - vitest.config.ts configures jsdom and setup file
- Local development
  - MemStorage used to avoid DB connectivity issues
  - Switch to DrizzleStorage once pooler DNS issues are resolved
- Migrations
  - Drizzle migrations output configured but migrations directory not present; generate before production deployment

Deployment Considerations
- Next.js (App Router)
  - Serverless-friendly DB driver (neon-http) used
  - Ensure environment variables present on the platform
- Express server
  - Requires persistent runtime for sessions (not serverless by default)
  - SESSION_SECRET must be set; secure cookie config in production
- Supabase
  - Realtime and Storage integrated
  - Apply storage RLS and bucket policies for production
  - Consider image CDN and transformations

Roadmap and Technical Debt
1) Unify Authentication
   - Choose a single auth path (NextAuth with email link or Supabase Auth) to reduce complexity
   - If keeping OTP, move OTP storage from in-memory to Redis or DB
2) Migrations
   - Generate and apply Drizzle migrations; add CI step to prevent schema drift
3) Storage Security
   - Implement RLS policies for all buckets, refine access paths, and use signed URLs for sensitive content
4) Realtime Enhancements
   - Add reconnection logic and backoff
   - Add typing indicators, read receipts via broadcast channels
5) Observability
   - Add Sentry, structured logs, request correlation IDs, and health checks
6) Performance
   - Add indexes for frequent query fields (spaceId, createdAt, userId)
   - Introduce pagination and keyset pagination where applicable
7) Architecture Simplification
   - Consider consolidating Express responsibilities into Next.js API routes to reduce duplication and operational overhead

Glossary
- NextAuth: Authentication library used in Next.js app
- Drizzle ORM: Type-safe ORM mapping to Postgres
- Supabase: Backend services for Postgres, Realtime, and Storage
- Presence: Real-time tracking of online users via Supabase channels
- RLS: Row-Level Security, recommended for Storage and database tables
- MemStorage: In-memory storage used for development/test
- DrizzleStorage: Database-backed storage implementation (disabled currently)

Key Files and Directories (non-exhaustive)
- shared/schema.ts: Database schema, types, and insert schemas
- src/lib/auth.ts: NextAuth configuration (DrizzleAdapter)
- src/lib/db.ts: Drizzle DB (neon-http) for Next.js app
- src/lib/supabase.ts: Supabase client (Next.js)
- src/lib/supabase-realtime.ts: Realtime manager
- src/lib/supabase-storage.ts: Storage manager
- src/lib/otp-service.ts: OTP service (Next.js side, in-memory for dev)
- server/index.ts: Express server bootstrap (express-session)
- server/routes.ts: Express routes (OTP and user endpoints)
- server/db.ts: Drizzle DB (postgres-js) for Express
- server/drizzle-storage.ts: DB-backed storage implementation (currently not used)
- server/storage.ts: IStorage interface and MemStorage implementation
- app/api/**: Next.js API routes (users, spaces, notes, lessons, messages, etc.)
- client/src/**: Client-side utilities for the separate web client

This architecture document reflects the current hybrid implementation and highlights recommended steps to improve production readiness and operational simplicity.