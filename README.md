# Space Notes

A collaborative workspace application with real-time messaging, note-taking, and lesson management built with Next.js, Supabase, and TypeScript.

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
