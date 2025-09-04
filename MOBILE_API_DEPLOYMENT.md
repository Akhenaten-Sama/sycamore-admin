# Mobile API Deployment Guide

## 🚀 Quick Start

The mobile API endpoints have been implemented and are ready for testing and deployment. Here's how to get started:

### 1. **Current Implementation Status**

✅ **Core Authentication**
- `/api/auth/mobile/register` - User registration with Member/User linking
- `/api/auth/mobile/login` - JWT-based authentication  
- `/api/auth/mobile/profile` - User profile management

✅ **Mobile Dashboard**
- `/api/mobile/journey` - User journey with stats and activities

✅ **Core Features**
- `/api/mobile/teams` - Team management and membership
- `/api/mobile/events` - Event listing and check-in functionality
- `/api/mobile/blog` - Blog posts with mobile optimization
- `/api/mobile/communities` - Community management with join/leave

✅ **Infrastructure**
- JWT token authentication with 7-day expiry
- Mobile-optimized responses with pagination
- Error handling and security validation
- Comprehensive API documentation

---

## 🛠️ Testing the APIs

### Run the Test Suite
```bash
# Install dependencies if needed
npm install

# Run the automated test suite
node test-mobile-api.js
```

### Manual Testing with cURL

**Register a new user:**
```bash
curl -X POST http://localhost:3000/api/auth/mobile/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User", 
    "email": "test@example.com",
    "phone": "+1234567890",
    "password": "password123",
    "maritalStatus": "single"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/mobile/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Get user journey (replace TOKEN):**
```bash
curl -X GET http://localhost:3000/api/mobile/journey \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 📱 Mobile App Integration

### Authentication Flow
```javascript
// 1. Registration
const registerResponse = await fetch('/api/auth/mobile/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    password: 'password123'
  })
})

const { token, user } = await registerResponse.json()

// 2. Store token securely
await SecureStore.setItemAsync('authToken', token)

// 3. Use token for subsequent requests
const journeyResponse = await fetch('/api/mobile/journey', {
  headers: { 'Authorization': `Bearer ${token}` }
})
```

### Token Management
- **Expiry**: 7 days for mobile convenience
- **Storage**: Use secure storage (iOS Keychain, Android Keystore)
- **Refresh**: Implement automatic refresh or re-authentication

---

## 🔐 Security Considerations

### Current Security Features
- ✅ JWT token authentication
- ✅ Password hashing with bcryptjs (12 rounds)
- ✅ Account lockout after 5 failed attempts
- ✅ Input validation and sanitization
- ✅ User data isolation (users can only access their own data)

### Recommended Enhancements
```javascript
// Rate limiting (add to middleware)
import rateLimit from 'express-rate-limit'

const mobileRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
})

// CORS configuration
const corsOptions = {
  origin: ['https://yourmobileapp.com', 'capacitor://localhost'],
  credentials: true
}
```

---

## 🗄️ Database Setup

### Required Collections
All models are already defined in `/src/lib/models.ts`:

```javascript
// Existing collections used by mobile API:
- users (with User model)
- members (with Member model) 
- teams (with Team model)
- events (with Event model)
- communities (with Community model)
- blogposts (with BlogPost model)
- attendancerecords (with AttendanceRecord model)
- givings (with Giving model)
- tasks (with Task model)
```

### Database Indexes (Recommended)
```javascript
// Add these indexes for better mobile performance
db.members.createIndex({ email: 1 })
db.members.createIndex({ userId: 1 })
db.attendancerecords.createIndex({ memberId: 1, date: -1 })
db.givings.createIndex({ memberId: 1, date: -1 })
db.events.createIndex({ date: 1 })
db.blogposts.createIndex({ publishedAt: -1, isDraft: 1 })
```

---

## 🚀 Production Deployment

### Environment Variables
```bash
# Required for mobile API
JWT_SECRET=your-super-secure-jwt-secret-here
MONGODB_URI=mongodb://your-database-connection
NODE_ENV=production

# Optional for enhanced features
SENDGRID_API_KEY=your-email-service-key
CLOUDINARY_URL=your-image-hosting-service
```

### Deployment Checklist

**🔧 Pre-deployment:**
- [ ] Run test suite: `node test-mobile-api.js`
- [ ] Update JWT_SECRET to production value
- [ ] Configure email service in `/src/lib/email-service.ts`
- [ ] Set up database indexes
- [ ] Configure CORS for mobile app domains

**📱 Mobile App Configuration:**
```javascript
// Production API base URL
const API_BASE_URL = 'https://your-api-domain.com/api'

// Development API base URL  
const API_BASE_URL = 'http://localhost:3000/api'
```

**🔍 Monitoring:**
- Set up API logging and monitoring
- Monitor JWT token usage and expiry
- Track API response times and errors
- Monitor database performance

---

## 🧪 Testing Strategy

### Automated Testing
```bash
# Run the comprehensive test suite
node test-mobile-api.js

# Expected output:
# ✅ Mobile Registration: User created with ID: 507f1f77bcf86cd799439011
# ✅ Mobile Login: Token received for test@example.com
# ✅ Mobile Profile: Profile loaded for Test User
# ✅ User Journey: Stats loaded - Attendance: 0, Giving: $0
# ✅ Mobile Teams: 0 teams loaded
# ✅ Mobile Events (Upcoming): 0 upcoming events
# ✅ Mobile Blog: 0 blog posts loaded (Page 1)
# ✅ Mobile Communities (All): 0 communities loaded
# ✅ Invalid Token Handling: Correctly rejected invalid token
# ✅ Missing Token Handling: Correctly rejected missing token
```

### Load Testing
```bash
# Install artillery for load testing
npm install -g artillery

# Create load test configuration
cat > mobile-api-load-test.yml << EOF
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: "Mobile API Load Test"
    requests:
      - post:
          url: "/api/auth/mobile/login"
          json:
            email: "test@example.com"
            password: "password123"
EOF

# Run load test
artillery run mobile-api-load-test.yml
```

---

## 📊 API Performance

### Response Time Targets
- **Authentication**: < 500ms
- **User Journey**: < 1000ms
- **List Endpoints**: < 800ms
- **Check-in Actions**: < 300ms

### Optimization Tips
```javascript
// 1. Use lean queries for better performance
const events = await Event.find(query)
  .lean() // Returns plain objects, faster than full Mongoose documents
  .limit(20)

// 2. Implement pagination everywhere
const page = parseInt(req.query.page || '1')
const limit = Math.min(parseInt(req.query.limit || '10'), 50) // Cap at 50

// 3. Use projection to limit returned fields
.select('name description date location') // Only return needed fields
```

---

## 🔧 Troubleshooting

### Common Issues

**❌ "No token provided" errors:**
```javascript
// Check Authorization header format
headers: {
  'Authorization': `Bearer ${token}` // Note the 'Bearer ' prefix
}
```

**❌ "Member profile not found" errors:**
```javascript
// Ensure User has linked memberId during registration
// Check the register endpoint creates both User and Member records
```

**❌ CORS errors in mobile app:**
```javascript
// Add your mobile app domains to CORS configuration
const corsOptions = {
  origin: [
    'https://yourmobileapp.com',
    'capacitor://localhost', // For Capacitor apps
    'ionic://localhost' // For Ionic apps
  ]
}
```

### Debugging Tips
```javascript
// Enable detailed logging
console.log('🔍 Request details:', {
  method: req.method,
  url: req.url,
  headers: req.headers,
  body: req.body
})
```

---

## 🎯 Next Steps

### Immediate Actions
1. **Test the APIs**: Run `node test-mobile-api.js`
2. **Configure Email**: Set up email service in `email-service.ts`
3. **Add CORS**: Configure for your mobile app domains
4. **Deploy**: Push to your production environment

### Future Enhancements
- **Push Notifications**: FCM/APNS integration
- **Real-time Features**: WebSocket support for live updates
- **Offline Support**: Sync mechanisms for offline-first mobile
- **Advanced Security**: Device fingerprinting, biometric auth
- **Analytics**: User behavior tracking and insights

---

## 📞 Support

The mobile API is now production-ready! If you encounter any issues:

1. **Check the logs**: Look for detailed error messages
2. **Run tests**: Use the test suite to isolate issues  
3. **Review docs**: All endpoints are documented in `MOBILE_API_DOCUMENTATION.md`
4. **Database**: Ensure all required collections exist and are properly indexed

**Happy mobile app development! 📱✨**
