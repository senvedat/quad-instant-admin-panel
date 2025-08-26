#!/bin/bash

# Quad Instant Admin Panel Setup Script
# This script helps you get the admin panel up and running quickly

set -e

echo "🚀 Quad Instant Admin Panel Setup"
echo "=================================="

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

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "✅ Created .env from example"
    echo ""
    echo "⚠️  IMPORTANT: You need to configure your PostgreSQL database!"
    echo "   Edit .env file and set your database connection details:"
    echo "   - ADMIN_DB_HOST=your-postgres-host"
    echo "   - ADMIN_DB_PORT=5432"
    echo "   - ADMIN_DB_NAME=quad_admin_panel"
    echo "   - ADMIN_DB_USER=your-admin-user"
    echo "   - ADMIN_DB_PASSWORD=your-admin-password"
    echo ""
    echo "   Make sure the database 'quad_admin_panel' exists:"
    echo "   createdb -h your-host -U your-user quad_admin_panel"
    echo ""
    echo "   The admin panel will automatically create tables when it starts!"
    echo ""
    read -p "Press Enter after configuring your database connection..."
else
    echo "✅ .env already exists"
fi

# Install Node.js dependencies
if [ -f package.json ]; then
    echo "📦 Installing Node.js dependencies..."
    if command -v npm &> /dev/null; then
        npm install
        echo "✅ Dependencies installed with npm"
    elif command -v yarn &> /dev/null; then
        yarn install
        echo "✅ Dependencies installed with yarn"
    else
        echo "⚠️  Neither npm nor yarn found. You'll need to install dependencies manually."
    fi
fi

# Start Docker services
echo "🐳 Starting Admin Panel..."
docker-compose up -d

echo "⏳ Waiting for admin panel to be ready..."
sleep 5

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo "✅ Admin Panel is running"
else
    echo "❌ Admin Panel failed to start"
    docker-compose logs
    exit 1
fi

echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "Your Quad Instant Admin Panel is now running:"
echo ""
echo "🌐 Admin Panel: http://localhost:3000"
echo ""
echo "📋 Default Login Credentials:"
echo "   Username: admin"
echo "   Password: admin123"
echo ""
echo "🔧 Next Steps:"
echo "1. Make sure your PostgreSQL database is configured in .env"
echo "2. Make sure the database 'quad_admin_panel' exists"
echo "3. Open http://localhost:3000 in your browser"
echo "4. The admin panel will automatically initialize the database"
echo "5. Login with the default credentials"
echo "6. Add your application database connections"
echo "7. Start managing your data!"
echo ""
echo "📚 For more information, check the README.md file"
echo ""
echo "🛑 To stop the service, run: docker-compose down"
echo "🔄 To restart the service, run: docker-compose restart"
echo "📊 To view logs, run: docker-compose logs -f admin-panel"