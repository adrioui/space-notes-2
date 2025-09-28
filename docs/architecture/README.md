# Architecture Documentation

This directory contains all documentation related to the system architecture and design patterns.

## 📋 Available Guides

### [Architecture Overview](./ARCHITECTURE.md)
Comprehensive system architecture documentation:
- Database schema and relationships
- Component structure and organization
- API design patterns
- Authentication flow
- Real-time messaging architecture

### [Optimistic Messaging Guide](./OPTIMISTIC_MESSAGING_GUIDE.md)
Detailed implementation of real-time messaging:
- Optimistic UI updates
- Conflict resolution strategies
- Supabase Realtime integration
- Message synchronization
- Error handling patterns

## 🏗️ System Overview

### Technology Stack
- **Frontend**: Next.js 14 with App Router
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Real-time**: Supabase Realtime
- **Authentication**: NextAuth.js with OTP
- **Styling**: Tailwind CSS
- **Testing**: Vitest + Testing Library

### Key Components
- **Spaces** - Collaborative workspaces
- **Messages** - Real-time chat functionality
- **Notes** - Block-based note editor
- **Lessons** - Educational content management
- **Users** - Authentication and profiles

## 🔄 Data Flow

1. **User Authentication** - OTP-based login with NextAuth
2. **Space Management** - Create/join collaborative spaces
3. **Real-time Messaging** - WebSocket-based chat with optimistic updates
4. **Note Collaboration** - Shared note editing with conflict resolution
5. **Lesson Management** - Educational content creation and sharing

## 📊 Database Design

### Core Tables
- `users` - User profiles and authentication
- `spaces` - Collaborative workspaces
- `space_members` - Space membership and roles
- `messages` - Chat messages with threading
- `notes` - Block-based note content
- `lessons` - Educational content structure

### Relationships
- Users can belong to multiple spaces
- Spaces contain messages, notes, and lessons
- Messages support threading and reactions
- Notes support collaborative editing

## 🔧 Development Patterns

### Component Architecture
- Server Components for data fetching
- Client Components for interactivity
- Custom hooks for business logic
- Shared utilities for common operations

### State Management
- React Query for server state
- React hooks for local state
- Optimistic updates for real-time features
- Context for global application state

## 📞 Support

For architecture questions, refer to the specific guides in this directory or review the codebase structure.
