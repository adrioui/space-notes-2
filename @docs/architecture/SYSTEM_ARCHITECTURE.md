# 🏗️ Space Notes - System Architecture

## 🎯 Overview

Space Notes is a modern collaborative learning platform built with a microservices-inspired architecture using Next.js full-stack capabilities. The system emphasizes real-time collaboration, scalability, and maintainability.

## 📊 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────┤
│  Next.js Frontend (React 18 + TypeScript)                  │
│  ├── Pages & Components                                     │
│  ├── State Management (React Query)                        │
│  ├── Real-time Updates (Supabase Client)                   │
│  └── Authentication (NextAuth.js Client)                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   API LAYER                                 │
├─────────────────────────────────────────────────────────────┤
│  Next.js API Routes                                         │
│  ├── Authentication Endpoints                              │
│  ├── Space Management APIs                                 │
│  ├── Message & Chat APIs                                   │
│  ├── User Management APIs                                  │
│  ├── Monitoring & Health Checks                            │
│  └── File Upload & Storage                                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 SERVICE LAYER                               │
├─────────────────────────────────────────────────────────────┤
│  Business Logic & Services                                  │
│  ├── Authentication Service (NextAuth.js)                  │
│  ├── Database Service (Drizzle ORM)                        │
│  ├── Real-time Service (Supabase)                          │
│  ├── Storage Service (Supabase Storage)                    │
│  └── Monitoring Service                                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  DATA LAYER                                 │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL Database                                        │
│  ├── Users & Authentication                                │
│  ├── Spaces & Memberships                                  │
│  ├── Messages & Chat History                               │
│  ├── Notes & Lessons                                       │
│  └── File Metadata                                         │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Core Components

### **1. Frontend Architecture**

#### **Component Structure**
```
src/
├── components/
│   ├── ui/              # Reusable UI components
│   ├── chat/            # Chat and messaging components
│   ├── spaces/          # Space management components
│   ├── auth/            # Authentication components
│   └── layout/          # Layout and navigation
├── hooks/               # Custom React hooks
├── lib/                 # Utility libraries and configurations
├── types/               # TypeScript type definitions
└── app/                 # Next.js App Router pages
```

#### **State Management**
- **React Query**: Server state management and caching
- **React Context**: Global UI state and user preferences
- **Local State**: Component-specific state with useState/useReducer

### **2. Backend Architecture**

#### **API Route Structure**
```
app/api/
├── auth/               # Authentication endpoints
│   ├── send-otp/       # OTP generation and sending
│   ├── verify-otp/     # OTP verification
│   └── [...nextauth]/  # NextAuth.js handlers
├── spaces/             # Space management
│   ├── [id]/           # Individual space operations
│   └── join/           # Space joining functionality
├── users/              # User management
├── messages/           # Chat and messaging
├── monitoring/         # Health checks and monitoring
└── demo/               # Demo account management
```

### **3. Database Architecture**

#### **Core Tables**
```sql
-- Users and Authentication
users (id, email, displayName, username, avatarType, avatarData)
accounts (userId, provider, providerAccountId, ...)
sessions (sessionToken, userId, expires)

-- Spaces and Collaboration
spaces (id, name, description, createdBy, inviteCode)
spaceMembers (spaceId, userId, role, joinedAt)

-- Communication
messages (id, spaceId, userId, content, messageType, attachments)

-- Content Management
notes (id, spaceId, authorId, title, content)
lessons (id, spaceId, title, description, content)
lessonProgress (userId, lessonId, completed, progress)
```

#### **Relationships**
- **Users** → **Spaces** (many-to-many via spaceMembers)
- **Users** → **Messages** (one-to-many)
- **Spaces** → **Messages** (one-to-many)
- **Spaces** → **Notes/Lessons** (one-to-many)

## 🔄 Real-time Architecture

### **Optimistic Updates**
```typescript
// Message Flow
1. User sends message
2. Optimistic update (immediate UI feedback)
3. Server processing (background)
4. Database persistence
5. Real-time broadcast to other users
6. Confirmation and state reconciliation
```

### **Real-time Communication**
- **Supabase Realtime**: PostgreSQL change streams
- **WebSocket Connections**: Persistent real-time connections
- **Event Broadcasting**: Cross-user synchronization
- **Conflict Resolution**: Optimistic update reconciliation

## 🔐 Security Architecture

### **Authentication Flow**
```
1. User Login Request
2. OTP Generation (Demo: Bypass)
3. OTP Verification
4. JWT Token Generation (NextAuth.js)
5. Session Management
6. API Request Authorization
```

### **Authorization Layers**
- **Route Protection**: Middleware-based route guards
- **API Authorization**: Session validation on API routes
- **Resource Access**: Role-based access control (RBAC)
- **Data Isolation**: User and space-based data segregation

## 📊 Data Flow Architecture

### **Read Operations**
```
Client Request → API Route → Database Query → Response Caching → Client Update
```

### **Write Operations**
```
Client Action → Optimistic Update → API Request → Database Write → Real-time Broadcast → State Reconciliation
```

### **Real-time Updates**
```
Database Change → Supabase Realtime → WebSocket → Client Update → UI Refresh
```

## 🚀 Deployment Architecture

### **Vercel Deployment**
- **Edge Functions**: API routes deployed as serverless functions
- **Static Generation**: Pre-rendered pages for performance
- **CDN Distribution**: Global content delivery
- **Environment Management**: Secure configuration handling

### **Database Hosting**
- **PostgreSQL**: Managed database service
- **Connection Pooling**: Efficient connection management
- **Backup Strategy**: Automated backups and recovery
- **Monitoring**: Performance and health monitoring

## 📈 Scalability Considerations

### **Performance Optimizations**
- **React Query Caching**: Intelligent data caching and invalidation
- **Optimistic Updates**: Immediate UI feedback
- **Code Splitting**: Lazy loading and bundle optimization
- **Image Optimization**: Next.js automatic image optimization

### **Scalability Features**
- **Serverless Architecture**: Auto-scaling API functions
- **Database Indexing**: Optimized query performance
- **Real-time Efficiency**: Selective subscription management
- **Caching Strategy**: Multi-layer caching approach

## 🔍 Monitoring Architecture

### **Health Checks**
- **API Health**: Endpoint availability monitoring
- **Database Health**: Connection and query performance
- **Real-time Health**: WebSocket connection status
- **Demo Account Health**: Demo functionality verification

### **Logging and Debugging**
- **Structured Logging**: Consistent log formatting
- **Error Tracking**: Comprehensive error capture
- **Performance Monitoring**: Response time tracking
- **User Activity**: Interaction and usage analytics

## 🎯 Design Principles

### **Modularity**
- **Component Isolation**: Self-contained, reusable components
- **Service Separation**: Clear separation of concerns
- **API Modularity**: Focused, single-responsibility endpoints

### **Maintainability**
- **TypeScript**: Strong typing for reliability
- **Documentation**: Comprehensive inline and external docs
- **Testing Strategy**: Unit and integration testing
- **Code Standards**: Consistent formatting and patterns

### **User Experience**
- **Real-time Feedback**: Immediate response to user actions
- **Progressive Enhancement**: Graceful degradation
- **Accessibility**: WCAG compliance and screen reader support
- **Mobile Responsiveness**: Cross-device compatibility

This architecture provides a solid foundation for a scalable, maintainable, and user-friendly collaborative learning platform.
