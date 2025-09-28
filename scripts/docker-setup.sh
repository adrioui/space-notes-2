#!/bin/bash

# Space Notes Docker Setup Script
# This script helps set up the Docker development environment

set -e

echo "🐳 Space Notes Docker Setup"
echo "=========================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "   Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    echo "   Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    if [ -f .env.docker.example ]; then
        cp .env.docker.example .env
        echo "✅ Created .env file from .env.docker.example"
        echo "⚠️  Please edit .env file with your Supabase credentials"
    elif [ -f .env.example ]; then
        cp .env.example .env
        echo "✅ Created .env file from .env.example"
        echo "⚠️  Please edit .env file with your configuration"
    else
        echo "❌ No .env template found. Please create .env file manually."
        exit 1
    fi
else
    echo "✅ .env file already exists"
fi

# Function to prompt for Supabase configuration
setup_supabase() {
    echo ""
    echo "🔧 Supabase Configuration"
    echo "========================"
    echo "Please enter your Supabase project details:"
    echo "(You can find these in your Supabase project settings)"
    echo ""
    
    read -p "Supabase Project URL (https://your-project.supabase.co): " SUPABASE_URL
    read -p "Supabase Anon Key: " SUPABASE_ANON_KEY
    read -p "Supabase Service Role Key: " SUPABASE_SERVICE_KEY
    
    if [ ! -z "$SUPABASE_URL" ] && [ ! -z "$SUPABASE_ANON_KEY" ] && [ ! -z "$SUPABASE_SERVICE_KEY" ]; then
        # Update .env file
        sed -i.bak "s|NEXT_PUBLIC_SUPABASE_URL=.*|NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL|" .env
        sed -i.bak "s|NEXT_PUBLIC_SUPABASE_ANON_KEY=.*|NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY|" .env
        sed -i.bak "s|SUPABASE_SERVICE_ROLE_KEY=.*|SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_KEY|" .env
        rm .env.bak 2>/dev/null || true
        echo "✅ Supabase configuration updated in .env file"
    else
        echo "⚠️  Skipping Supabase configuration. Please update .env file manually."
    fi
}

# Ask if user wants to configure Supabase
echo ""
read -p "Do you want to configure Supabase now? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    setup_supabase
fi

# Generate NextAuth secret if not set
if grep -q "your-development-secret-key" .env 2>/dev/null; then
    echo ""
    echo "🔐 Generating NextAuth secret..."
    if command -v openssl &> /dev/null; then
        SECRET=$(openssl rand -base64 32)
        sed -i.bak "s|NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET=$SECRET|" .env
        rm .env.bak 2>/dev/null || true
        echo "✅ Generated NextAuth secret"
    else
        echo "⚠️  OpenSSL not found. Please set NEXTAUTH_SECRET manually in .env file"
    fi
fi

# Build and start services
echo ""
echo "🚀 Starting Docker services..."
echo "This may take a few minutes on first run..."

# Pull images first to show progress
docker-compose pull

# Build and start services
docker-compose up --build -d

# Wait for services to be ready
echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo ""
    echo "🎉 Setup complete!"
    echo ""
    echo "📱 Application: http://localhost:3000"
    echo "🗄️  Database: localhost:5432 (if using local PostgreSQL)"
    echo "🔧 Redis: localhost:6379 (if enabled)"
    echo ""
    echo "📋 Useful commands:"
    echo "   docker-compose logs -f app    # View application logs"
    echo "   docker-compose down           # Stop all services"
    echo "   docker-compose up -d          # Start services in background"
    echo "   docker-compose exec app bash  # Access application container"
    echo ""
    echo "📖 For more information, see the Docker section in README.md"
else
    echo ""
    echo "❌ Some services failed to start. Check the logs:"
    echo "   docker-compose logs"
    exit 1
fi
