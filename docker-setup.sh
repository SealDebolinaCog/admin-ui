#!/bin/bash

# Docker Setup Script for Admin UI
echo "🐳 Setting up Docker environment for Admin UI..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create .env file for backend if it doesn't exist
if [ ! -f "./backend/.env" ]; then
    echo "📝 Creating backend .env file..."
    cp ./backend/.env.example ./backend/.env
fi

echo "✅ Docker setup complete!"
echo ""
echo "🚀 Available commands:"
echo ""
echo "  🔧 Development:"
echo "    docker-compose --env-file .env.development --profile dev up --build"
echo "    Access: Frontend http://localhost:3000, Backend http://localhost:3001"
echo ""
echo "  🚀 Production:"
echo "    docker-compose --env-file .env.production --profile prod up --build"
echo "    Access: http://localhost (Nginx serves frontend + proxies API)"
echo ""
echo "  🛑 Stop services:"
echo "    docker-compose down"
echo ""
echo "  🧹 Clean up:"
echo "    docker-compose down -v --rmi all"
echo ""
echo "💡 Tip: Use 'docker-compose logs -f' to view logs"
echo "🎯 Ready to run with consolidated Docker setup!"
