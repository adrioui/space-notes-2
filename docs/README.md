# Space Notes Documentation

Welcome to the Space Notes application documentation. This directory contains comprehensive guides for development, deployment, testing, and architecture.

## 📁 Documentation Structure

### 🚀 [Deployment](./deployment/)
- **[Vercel Deployment Guide](./deployment/VERCEL_DEPLOYMENT_GUIDE.md)** - Complete guide for deploying to Vercel with environment setup, configuration, and troubleshooting

### 🧪 [Testing](./testing/)
- **[Testing README](./testing/TESTING_README.md)** - Overview of the testing infrastructure and how to run tests
- **[Authentication Testing Guide](./testing/AUTHENTICATION_TESTING_GUIDE.md)** - Comprehensive guide for testing authentication flows and OTP functionality

### 🏗️ [Architecture](./architecture/)
- **[Architecture Overview](./architecture/ARCHITECTURE.md)** - System architecture, database schema, and component structure
- **[Optimistic Messaging Guide](./architecture/OPTIMISTIC_MESSAGING_GUIDE.md)** - Implementation details for real-time messaging with optimistic updates

## 🚀 Quick Start

### For Developers
1. Read the [Architecture Overview](./architecture/ARCHITECTURE.md) to understand the system
2. Follow the [Testing README](./testing/TESTING_README.md) to set up your testing environment
3. Review the [Authentication Testing Guide](./testing/AUTHENTICATION_TESTING_GUIDE.md) for auth-related development

### For Deployment
1. Follow the [Vercel Deployment Guide](./deployment/VERCEL_DEPLOYMENT_GUIDE.md) for production deployment
2. Ensure all environment variables are properly configured
3. Run the build process locally first to catch any issues

### For Testing
1. Run `npm run test` for unit tests
2. Run `npm run test:coverage` for coverage reports
3. See [Testing README](./testing/TESTING_README.md) for detailed testing instructions

## 📋 Key Features Documented

### Core Functionality
- **Real-time Messaging** - WebSocket-based chat with Supabase Realtime
- **Space Management** - Create and manage collaborative spaces
- **Authentication** - OTP-based authentication with NextAuth
- **Notes & Lessons** - Block-based note editor with lesson management

### Technical Implementation
- **Next.js App Router** - Modern React framework with server components
- **Supabase Integration** - Database, authentication, and real-time features
- **TypeScript** - Full type safety across the application
- **Testing Infrastructure** - Comprehensive unit and integration tests

## 🔧 Development Workflow

### Setting Up
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Run development server
npm run dev
```

### Testing
```bash
# Run all tests
npm run test

# Run specific test suites
npm run test:auth-unit
npm run test:api-unit
npm run test:hooks-unit

# Run with coverage
npm run test:coverage
```

### Building
```bash
# Build for production
npm run build

# Build for Vercel
npm run vercel-build
```

## 📚 Additional Resources

### External Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Vitest Documentation](https://vitest.dev/)

### Project Structure
```
space-notes/
├── app/                 # Next.js App Router pages and API routes
├── src/                 # Source code (components, hooks, utilities)
├── shared/              # Shared types and schemas
├── scripts/             # Build and deployment scripts
├── docs/                # Documentation (this directory)
└── types/               # TypeScript type definitions
```

## 🤝 Contributing

When contributing to this project:

1. **Read the Architecture Guide** - Understand the system before making changes
2. **Write Tests** - All new features should include comprehensive tests
3. **Update Documentation** - Keep documentation in sync with code changes
4. **Follow Conventions** - Use the established patterns and naming conventions

## 📞 Support

If you need help:

1. Check the relevant documentation in this directory
2. Review the troubleshooting sections in each guide
3. Look at the test files for usage examples
4. Check the GitHub issues for known problems

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Maintainers**: Space Notes Development Team
