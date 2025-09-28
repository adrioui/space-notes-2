# 🚀 Space Notes

A comprehensive collaborative learning platform with real-time messaging, note-taking, and lesson management built with Next.js, Supabase, and TypeScript.

**🌐 Live Demo:** https://space-notes-psi.vercel.app

## 📚 Complete Documentation

**📖 Full documentation is available in the [`@docs/`](./@docs/) directory:**

- **⭐ [Technical Architecture Summary](./@docs/architecture/TECHNICAL_ARCHITECTURE_SUMMARY.md)** - Executive overview and design decisions
- **🏗️ [System Architecture](./@docs/architecture/SYSTEM_ARCHITECTURE.md)** - Complete system design and architecture
- **🔌 [API Reference](./@docs/api/API_REFERENCE.md)** - Comprehensive API documentation
- **🔧 [Technical Fixes](./@docs/fixes/)** - Critical fixes and solutions implemented
- **✨ [Features](./@docs/features/)** - Core features and implementations
- **📊 [Monitoring](./@docs/monitoring/)** - Health checks and monitoring systems
- **🚀 [Deployment](./@docs/deployment/)** - Deployment guides and configuration

## 🎯 Quick Start

### **Demo Access (Instant Login)**
- **Admin Demo**: `demo-admin@example.com`
- **Member Demo**: `demo-member@example.com`

*Both demo accounts feature auto-login - no OTP required!*

## ✨ Features

- 🚀 **Real-time Messaging** - WebSocket-based chat with instant message delivery
- 📝 **Collaborative Notes** - Block-based note editor with real-time collaboration
- 🎓 **Lesson Management** - Create and share educational content
- 👥 **Space Management** - Organize work in collaborative spaces
- 🔐 **Secure Authentication** - OTP-based authentication with NextAuth
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Database**: Supabase (PostgreSQL)
- **Authentication**: NextAuth.js with OTP
- **Real-time**: Supabase Realtime
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Testing**: Vitest + Testing Library

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/space-notes.git
   cd space-notes
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your Supabase credentials and other required variables.

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🐳 Docker Setup

Run the entire application stack with Docker - no need to install Node.js locally!

### Prerequisites

- Docker and Docker Compose installed
- Supabase account (for database and real-time features)

### Quick Start with Docker

1. **Clone and setup environment**
   ```bash
   git clone https://github.com/your-username/space-notes.git
   cd space-notes
   cp .env.example .env.local
   ```

2. **Configure environment variables**
   Edit `.env.local` with your Supabase credentials:
   ```bash
   # Required for Docker setup
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   NEXTAUTH_SECRET=your-secret-key-here
   ```

3. **Start the application**
   ```bash
   # Development mode with hot reloading
   docker-compose up

   # Or run in background
   docker-compose up -d
   ```

4. **Access the application**
   - Application: [http://localhost:3000](http://localhost:3000)
   - Database (if using local): [localhost:5432](localhost:5432)
   - Redis (if enabled): [localhost:6379](localhost:6379)

### Docker Commands

```bash
# Build and start all services
docker-compose up --build

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes local database data)
docker-compose down -v

# Rebuild specific service
docker-compose build app

# Run commands in container
docker-compose exec app npm run test
docker-compose exec app npm run build
```

### Production Deployment with Docker

```bash
# Build production image
docker build -t space-notes:latest .

# Run production compose
docker-compose -f docker-compose.prod.yml up -d

# Or deploy to your container platform
docker push your-registry/space-notes:latest
```

### Docker Configuration Options

#### Using Local Database
The default `docker-compose.yml` includes a PostgreSQL container. To use it:

1. Set `DATABASE_URL=postgresql://postgres:password@db:5432/space_notes`
2. The database will be automatically initialized

#### Using Supabase (Recommended)
For production or if you prefer Supabase:

1. Keep your Supabase `DATABASE_URL`
2. Comment out the `db` service in `docker-compose.yml`
3. Remove `depends_on: - db` from the app service

#### Environment Variables in Docker

Create a `.env` file in the project root:
```bash
# Database (choose one)
DATABASE_URL=postgresql://postgres:password@db:5432/space_notes  # Local
# DATABASE_URL=postgresql://user:pass@host:5432/db                # Supabase

# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# NextAuth (required)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# Optional services
EMAIL_FROM=noreply@yourdomain.com
TWILIO_ACCOUNT_SID=your-twilio-sid
```

### Troubleshooting Docker Issues

#### Common Problems

**Port already in use:**
```bash
# Check what's using port 3000
lsof -i :3000

# Use different port
docker-compose up --env PORT=3001
```

**Database connection issues:**
```bash
# Check database logs
docker-compose logs db

# Reset database
docker-compose down -v
docker-compose up db
```

**Build failures:**
```bash
# Clean build
docker-compose build --no-cache app

# Check build logs
docker-compose build app --progress=plain
```

**Permission issues (Linux/macOS):**
```bash
# Fix file permissions
sudo chown -R $USER:$USER .
```

#### Performance Optimization

For better performance in development:

```bash
# Use bind mounts for faster file watching
docker-compose -f docker-compose.yml -f docker-compose.override.yml up
```

#### Memory Issues

If you encounter memory issues:

```bash
# Increase Docker memory limit (Docker Desktop)
# Settings > Resources > Memory > 4GB+

# Or limit container memory
docker-compose up --memory=2g
```

## 📚 Documentation

Comprehensive documentation is available in the [`docs/`](./docs/) directory:

- **[📖 Documentation Overview](./docs/README.md)** - Start here for all documentation
- **[🚀 Deployment Guide](./docs/deployment/VERCEL_DEPLOYMENT_GUIDE.md)** - Deploy to Vercel
- **[🏗️ Architecture](./docs/architecture/ARCHITECTURE.md)** - System design and structure
- **[🧪 Testing Guide](./docs/testing/TESTING_README.md)** - Testing infrastructure and practices

## 🧪 Testing

Run the test suite:

```bash
# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Run specific test suites
npm run test:auth-unit
npm run test:api-unit
npm run test:hooks-unit
```

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect to Vercel**
   - Import your repository to Vercel
   - Vercel will auto-detect Next.js configuration

2. **Configure Environment Variables**
   - Copy variables from `.env.vercel.example`
   - Set them in your Vercel project settings

3. **Deploy**
   - Push to your main branch
   - Vercel will automatically build and deploy

For detailed deployment instructions, see the [Deployment Guide](./docs/deployment/VERCEL_DEPLOYMENT_GUIDE.md).

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run test         # Run tests
npm run lint         # Run ESLint
npm run check        # TypeScript type checking
```

### Project Structure

```
space-notes/
├── app/                 # Next.js App Router (pages & API routes)
├── src/                 # Source code
│   ├── components/      # React components
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utilities and configurations
│   └── types/          # TypeScript type definitions
├── shared/             # Shared schemas and types
├── docs/               # Documentation
└── scripts/            # Build and utility scripts
```

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes**
4. **Add tests** for new functionality
5. **Run the test suite** (`npm run test`)
6. **Commit your changes** (`git commit -m 'Add amazing feature'`)
7. **Push to the branch** (`git push origin feature/amazing-feature`)
8. **Open a Pull Request**

### Development Guidelines

- Write tests for new features
- Follow the existing code style
- Update documentation as needed
- Ensure all tests pass before submitting

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework for production
- [Supabase](https://supabase.com/) - Open source Firebase alternative
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Vercel](https://vercel.com/) - Platform for frontend frameworks and static sites

## 📞 Support

- 📖 [Documentation](./docs/README.md)
- 🐛 [Report Issues](https://github.com/your-username/space-notes/issues)
- 💬 [Discussions](https://github.com/your-username/space-notes/discussions)

---

**Built with ❤️ by the Space Notes team**
