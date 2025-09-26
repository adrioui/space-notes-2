# Overview

This is a **Spaces & Group Chat** web application that combines real-time messaging with collaborative learning tools. The platform allows users to create and join spaces where they can chat, share content, create block-based notes, and publish structured lessons. The application features OTP-based authentication, customizable profiles with emoji avatars, and rich notification controls.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: Radix UI primitives with shadcn/ui design system
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **State Management**: React Query for server state and React Context for auth state
- **Real-time Communication**: WebSocket client for live chat and notifications

## Backend Architecture
- **Framework**: Express.js with TypeScript
- **Session Management**: Express sessions with PostgreSQL storage via connect-pg-simple
- **Real-time Features**: WebSocket server for chat and live updates
- **API Structure**: RESTful endpoints with WebSocket enhancements for real-time features
- **Development Setup**: Hot module replacement with Vite middleware integration

## Database Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect  
- **Schema Management**: Shared schema definitions between client and server
- **Database Provider**: Neon Database (serverless PostgreSQL) via DATABASE_URL
- **Storage Implementation**: DrizzleStorage class providing full database persistence for all data operations
- **Migration Strategy**: Drizzle Kit for schema migrations and database pushes
- **Connection**: Uses Neon HTTP driver with fallback from DATABASE_URL to SUPABASE_DATABASE_URL

## Authentication System
- **Method**: OTP-only authentication (email or phone)
- **Session Storage**: Server-side sessions with PostgreSQL backing
- **Profile Management**: Custom emoji avatars with background colors or image uploads
- **User Data**: Display names, usernames, and rich profile customization

## Content Management
- **Spaces**: Themed collaboration areas with custom wallpapers and invite codes
- **Real-time Chat**: Text and image messages with system notifications
- **Block-based Notes**: Rich content editor supporting text, todo lists, and links
- **Structured Lessons**: Multi-topic lessons with YouTube/external content and progress tracking
- **Publishing System**: Content publication with notification controls (notify all vs quiet)

## External Dependencies

- **Database**: Neon Database (PostgreSQL-compatible serverless database)
- **UI Framework**: Radix UI for accessible component primitives
- **Styling**: Tailwind CSS for utility-first styling
- **Real-time**: Native WebSocket implementation for live features
- **Form Handling**: React Hook Form with Zod validation
- **File Handling**: Browser-based file uploads with blob URL generation (production would use cloud storage)
- **Development Tools**: Replit-specific plugins for development environment integration