# 🏛️ Sycamore Church Admin System

A comprehensive church administration system built with Next.js 15, featuring role-based access control, member management, team organization, and form submissions with CSV export capabilities.

## ✨ Features

- **🔐 Role-Based Authentication & Authorization (RBAC)**
  - Super Admin, Admin, and Team Leader roles
  - Granular permission system
  - Secure JWT-based authentication
  - Account lockout protection

- **👥 Member Management**
  - Complete member profiles with contact information
  - Anniversary tracking and notifications
  - Advanced search and filtering
  - Bulk member operations

- **🏆 Team Management**
  - Team creation and organization
  - Role-based team access for Team Leaders
  - Member assignment to teams
  - Team-specific dashboards

- **📝 Form Submissions & CSV Export**
  - Organized form submissions by type
  - CSV export functionality
  - Detailed submission tracking
  - Form analytics

- **📊 Dashboard & Analytics**
  - Real-time church statistics
  - Attendance tracking
  - Event management
  - Blog/news management

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- MongoDB (local or cloud instance)
- Git

### Automated Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd sycamore-admin
```

2. Run the setup script:
```bash
chmod +x setup.sh
./setup.sh
```

3. Start the development server:
```bash
npm run dev
```

4. Visit [http://localhost:3000/login](http://localhost:3000/login)

### Manual Setup

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env.local
```

3. Update `.env.local` with your configuration:
```env
MONGODB_URI=mongodb://localhost:27017/sycamore-church
JWT_SECRET=your-super-secret-jwt-key-change-in-production
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. Seed admin users:
```bash
npm run seed-admin
```

5. Start development server:
```bash
npm run dev
```

## 🔑 Demo Credentials

| Role | Email | Password | Permissions |
|------|-------|----------|-------------|
| Super Admin | superadmin@church.org | admin123 | Full system access |
| Admin | admin@church.org | admin123 | Most features except user management |
| Team Leader | leader@church.org | leader123 | Team-specific access only |

## 🏗️ Architecture

### Tech Stack

- **Frontend**: Next.js 15 with TypeScript
- **Backend**: Next.js API routes
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with bcryptjs
- **Styling**: Tailwind CSS
- **State Management**: React Context API

### Folder Structure

```
src/
├── app/                          # Next.js 15 app directory
│   ├── api/                      # API routes
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── members/              # Member management
│   │   ├── teams/                # Team management
│   │   └── admin/                # Admin user management
│   ├── login/                    # Login page
│   ├── admin-management/         # Admin user management UI
│   ├── form-submissions/         # Form submission management
│   ├── dashboard/                # Main dashboard
│   └── [feature]/                # Feature-specific pages
├── components/                   # Reusable components
│   ├── ui/                       # Basic UI components
│   └── [feature-components]      # Feature-specific components
├── lib/                          # Utilities and configurations
│   ├── models.ts                 # Database models
│   ├── mongodb.ts                # MongoDB connection
│   └── auth.ts                   # Authentication utilities
└── types/                        # TypeScript type definitions
```

## 🛡️ Security Features

### Authentication
- JWT token-based authentication
- Password hashing with bcryptjs
- Account lockout after failed attempts
- Secure cookie handling

### Authorization
- Role-based access control (RBAC)
- Permission-based feature access
- Route protection middleware
- Team-level access restrictions

### Data Protection
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF protection

## 📊 Role Permissions

### Super Admin
- ✅ Manage all users and admins
- ✅ Access all features
- ✅ System configuration
- ✅ Full member and team management
- ✅ Form submission management

### Admin
- ✅ Member management
- ✅ Team management
- ✅ Event management
- ✅ Blog management
- ✅ Form submissions
- ❌ User management

### Team Leader
- ✅ View assigned team members
- ✅ Basic member information
- ✅ Team-specific attendance
- ❌ Other teams' data
- ❌ System administration

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | Secret for JWT token signing | Yes |
| `NODE_ENV` | Environment (development/production) | Yes |
| `NEXT_PUBLIC_APP_URL` | Application base URL | Yes |

### Database Collections

- **users**: Authentication and user roles
- **members**: Church member profiles
- **teams**: Team organization
- **events**: Church events and activities
- **attendance**: Attendance tracking
- **blogs**: Blog/news posts
- **tasks**: Task management
- **anniversaries**: Member anniversaries

## 📝 API Documentation

### Authentication Endpoints

```
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

### Member Management

```
GET    /api/members          # List members
POST   /api/members          # Create member
GET    /api/members/[id]     # Get member
PUT    /api/members/[id]     # Update member
DELETE /api/members/[id]     # Delete member
POST   /api/members/import   # Bulk import
```

### Team Management

```
GET    /api/teams                    # List teams
POST   /api/teams                    # Create team
GET    /api/teams/[id]               # Get team
PUT    /api/teams/[id]               # Update team
DELETE /api/teams/[id]               # Delete team
GET    /api/teams/[id]/members       # Team members
POST   /api/teams/[id]/members       # Add member to team
```

## 🚀 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Connect to Vercel
3. Set environment variables
4. Deploy

### Manual Deployment

1. Build the application:
```bash
npm run build
```

2. Start production server:
```bash
npm start
```

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run seed-admin` - Seed admin users

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For support and questions:

- Create an issue on GitHub
- Check the documentation
- Review the API documentation

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

Built with ❤️ for church communities
