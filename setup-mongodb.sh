#!/bin/bash

# MongoDB Setup Script for Sycamore Admin
echo "🌟 Sycamore Church Admin - MongoDB Setup"
echo "========================================"

# Check if running on Windows
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
    echo "💻 Detected Windows OS"
    echo ""
    echo "📋 To set up MongoDB on Windows:"
    echo "1. Download MongoDB Community Server from: https://www.mongodb.com/try/download/community"
    echo "2. Install MongoDB following the installation wizard"
    echo "3. Start MongoDB service:"
    echo "   - Open Command Prompt as Administrator"
    echo "   - Run: net start MongoDB"
    echo ""
    echo "🌐 Alternative: Use MongoDB Atlas (Cloud)"
    echo "1. Go to https://www.mongodb.com/atlas"
    echo "2. Create a free account and cluster"
    echo "3. Get your connection string"
    echo "4. Update MONGODB_URI in .env.local"
    echo ""
    echo "🧪 For testing without MongoDB:"
    echo "You can switch back to in-memory storage by running:"
    echo "  mv src/app/api/members/route.ts src/app/api/members/route-mongodb.ts"
    echo "  mv src/app/api/members/route-inmemory.ts src/app/api/members/route.ts"
    
elif [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🍎 Detected macOS"
    echo ""
    echo "📦 Installing MongoDB using Homebrew..."
    if command -v brew &> /dev/null; then
        brew tap mongodb/brew
        brew install mongodb-community
        echo "✅ MongoDB installed!"
        echo ""
        echo "🚀 To start MongoDB:"
        echo "  brew services start mongodb-community"
        echo ""
        echo "🛑 To stop MongoDB:"
        echo "  brew services stop mongodb-community"
    else
        echo "❌ Homebrew not found. Please install Homebrew first:"
        echo "  /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
    fi
    
else
    echo "🐧 Detected Linux"
    echo ""
    echo "📦 Installing MongoDB..."
    if command -v apt-get &> /dev/null; then
        echo "Using apt-get (Ubuntu/Debian)..."
        curl -fsSL https://pgp.mongodb.com/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
        echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
        sudo apt-get update
        sudo apt-get install -y mongodb-org
        echo "✅ MongoDB installed!"
        echo ""
        echo "🚀 To start MongoDB:"
        echo "  sudo systemctl start mongod"
        echo "  sudo systemctl enable mongod"
    elif command -v yum &> /dev/null; then
        echo "Using yum (CentOS/RHEL)..."
        echo "Please follow the official MongoDB installation guide for your distribution:"
        echo "https://docs.mongodb.com/manual/administration/install-on-linux/"
    else
        echo "Package manager not detected. Please install MongoDB manually:"
        echo "https://docs.mongodb.com/manual/administration/install-on-linux/"
    fi
fi

echo ""
echo "📝 Next Steps:"
echo "1. Start your MongoDB service"
echo "2. Run: npm run dev"
echo "3. Visit http://localhost:3000/members"
echo "4. Test adding members and CSV import functionality"
echo ""
echo "💡 Need help? Check the README.md file or the MongoDB documentation"
