#!/bin/bash

echo "🚀 Setting up Sycamore Church Admin System..."
echo "================================================"

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local file..."
    cat > .env.local << EOL
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/sycamore-church

# JWT Secret (Change this in production!)
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# App Configuration
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOL
    echo "✅ .env.local created successfully!"
    echo "⚠️  Please update the environment variables in .env.local with your actual values"
else
    echo "ℹ️  .env.local already exists"
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed!"
else
    echo "ℹ️  Dependencies already installed"
fi

# Seed admin users
echo "🌱 Seeding admin users..."
npm run seed-admin

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📋 Next Steps:"
echo "1. Update your .env.local file with your MongoDB URI"
echo "2. Make sure MongoDB is running"
echo "3. Run 'npm run dev' to start the development server"
echo ""
echo "🔐 Demo Admin Credentials:"
echo "Super Admin: superadmin@church.org / admin123"
echo "Admin: admin@church.org / admin123"
echo "Team Leader: leader@church.org / leader123"
echo ""
echo "🌐 Application will be available at: http://localhost:3000/login"
echo ""
echo "Happy coding! 🎊"
