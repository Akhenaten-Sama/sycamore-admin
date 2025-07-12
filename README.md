# 🌟 Sycamore Church Admin

A modern, full-stack admin backoffice for church management built with Next.js, TypeScript, Tailwind CSS, and MongoDB.

## ✨ Features

- **Member Management**: Complete CRUD operations for church members
- **CSV Import**: Bulk import members from CSV files
- **Event Management**: Schedule and manage church events
- **Blog Management**: Create and manage blog posts
- **Anniversary Tracking**: Birthday and wedding anniversary management
- **Attendance Tracking**: Track member attendance for events
- **Team Management**: Organize members into teams with leads
- **Modern UI**: Beautiful, responsive design with Tailwind CSS
- **Real-time Updates**: Live data updates across the application

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd sycamore-admin
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up MongoDB** (Choose one option):
   
   **Option A: MongoDB Atlas (Cloud - Recommended)**
   - Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Create a free account and cluster
   - Get your connection string
   - Update `MONGODB_URI` in `.env.local`

   **Option B: Local MongoDB**
   - Run the setup script: `./setup-mongodb.sh`
   - Or manually install MongoDB from [mongodb.com](https://www.mongodb.com/try/download/community)

4. **Configure environment variables**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your MongoDB connection string
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   - Navigate to [http://localhost:3000](http://localhost:3000)
   - Access the members page at [http://localhost:3000/members](http://localhost:3000/members)

## 💾 Database Setup

### MongoDB Atlas (Cloud)
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get your connection string
4. Update `MONGODB_URI` in `.env.local`:
   ```
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/sycamore-admin?retryWrites=true&w=majority
   ```

### Local MongoDB
Run the setup script for your operating system:
```bash
# Make script executable (Mac/Linux)
chmod +x setup-mongodb.sh
./setup-mongodb.sh
```

## 📊 CSV Import

The application supports CSV import for members with the following format:

| Column | Required | Description |
|--------|----------|-------------|
| firstName | Yes | Member's first name |
| lastName | Yes | Member's last name |
| email | Yes | Member's email address |
| phone | No | Phone number |
| address | No | Home address |
| dateOfBirth | No | Date of birth (YYYY-MM-DD) |
| maritalStatus | No | single, married, or divorced |
| weddingAnniversary | No | Wedding date (YYYY-MM-DD) |
| isFirstTimer | No | true/false or yes/no |
| isTeamLead | No | true/false or yes/no |
| isAdmin | No | true/false or yes/no |
| emergencyContactName | No | Emergency contact name |
| emergencyContactPhone | No | Emergency contact phone |

Download the sample CSV from the members page to see the exact format.

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Database**: MongoDB with Mongoose
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **CSV Processing**: PapaParse

## 📁 Project Structure

```
src/
├── app/
│   ├── api/                 # API routes
│   ├── members/            # Members management
│   ├── events/             # Events management
│   ├── blog/               # Blog management
│   └── ...
├── components/
│   ├── ui/                 # UI components
│   └── dashboard-layout.tsx
├── lib/
│   ├── mongodb.ts          # Database connection
│   ├── models.ts           # Mongoose models
│   ├── api-client.ts       # Frontend API client
│   └── utils.ts            # Utility functions
└── types/                  # TypeScript type definitions
```

## 🔧 Development

### Adding New Features
1. Create API routes in `src/app/api/`
2. Add Mongoose models in `src/lib/models.ts`
3. Create pages in `src/app/`
4. Add reusable components in `src/components/`

### Database Models
- **Member**: Church member information
- **Event**: Church events and activities
- **BlogPost**: Blog posts and announcements
- **Team**: Member teams and leadership
- **Anniversary**: Birthday and wedding tracking
- **AttendanceRecord**: Event attendance tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For support or questions about setting up the church admin system:
- Check the setup script: `./setup-mongodb.sh`
- Review the sample CSV format in `public/sample-members.csv`
- Ensure MongoDB is running and accessible

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

Built with ❤️ for church communities
