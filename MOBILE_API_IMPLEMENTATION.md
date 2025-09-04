# Mobile API Implementation Guide

## Overview
This document outlines the implementation strategy for creating the mobile-facing API endpoints. Many endpoints already exist in the admin system and need to be adapted/extended for mobile use.

---

## Current Status & Implementation Needed

### ✅ Already Implemented (Admin APIs that can be adapted)
- Members CRUD (`/api/members`)
- Teams (`/api/teams`) 
- Communities (`/api/communities`)
- Events (`/api/events`)
- Blog (`/api/blog`)
- Media (`/api/media`)
- Attendance (`/api/attendance`)
- Tasks (`/api/tasks`)
- Forms (`/api/forms`)
- Giving/Finance (`/api/giving`)

### 🔄 Need Mobile-Specific Adaptations
Most existing endpoints need mobile-friendly versions with:
- Different data filtering (user-specific)
- Simplified responses
- Mobile-optimized pagination
- User permission filtering

### ❌ Need to be Created from Scratch

#### 1. Mobile Authentication System
**File**: `src/app/api/auth/mobile/`

```typescript
// src/app/api/auth/mobile/register/route.ts
export async function POST(request: NextRequest) {
  // Handle member registration
  // Send verification email
  // Create initial member record with isActive: false
}

// src/app/api/auth/mobile/verify-email/route.ts
export async function POST(request: NextRequest) {
  // Verify email with code
  // Activate member account
}

// src/app/api/auth/mobile/login/route.ts
export async function POST(request: NextRequest) {
  // Authenticate member
  // Return JWT token
  // Include mobile-specific user data
}
```

#### 2. User Journey & Dashboard
**File**: `src/app/api/mobile/journey/route.ts`

```typescript
export async function GET(request: NextRequest) {
  const user = await verifyMobileToken(request);
  
  // Aggregate user statistics
  const stats = {
    attendanceStreak: await calculateAttendanceStreak(user.id),
    totalAttendance: await getTotalAttendance(user.id),
    devotionalStreak: await getDevotionalStreak(user.id),
    totalGiving: await getTotalGiving(user.id),
    communitiesCount: await getUserCommunitiesCount(user.id),
    tasksAssigned: await getUserTasksCount(user.id, 'assigned'),
    tasksCompleted: await getUserTasksCount(user.id, 'completed')
  };
  
  // Get recent activities
  const recentActivities = await getRecentActivities(user.id);
  
  // Get upcoming events
  const upcomingEvents = await getUpcomingEvents(user.id);
  
  return NextResponse.json({
    success: true,
    data: { stats, recentActivities, upcomingEvents }
  });
}
```

#### 3. Devotionals System
**Files**: `src/app/api/mobile/devotionals/`

```typescript
// Database Schema
interface Devotional {
  id: string;
  title: string;
  scripture: string;
  content: string;
  prayer: string;
  date: Date;
  author: string;
  createdAt: Date;
}

interface DevotionalRead {
  userId: string;
  devotionalId: string;
  readAt: Date;
}

// API Routes
// GET /api/mobile/devotionals/today
// GET /api/mobile/devotionals/{date}
// POST /api/mobile/devotionals/{id}/read
// GET /api/mobile/devotionals/streak
```

#### 4. Prayer Requests System
**Files**: `src/app/api/mobile/prayers/`

```typescript
interface PrayerRequest {
  id: string;
  userId: string;
  title: string;
  content: string;
  category: 'personal' | 'family' | 'church' | 'nation';
  isAnonymous: boolean;
  isPrivate: boolean;
  isAnswered: boolean;
  prayerCount: number;
  createdAt: Date;
}

interface PrayerActivity {
  userId: string;
  prayerId: string;
  prayedAt: Date;
}
```

#### 5. Comments System
**Files**: `src/app/api/mobile/comments/`

```typescript
interface Comment {
  id: string;
  userId: string;
  entityType: 'blog' | 'media' | 'devotional' | 'prayer';
  entityId: string;
  content: string;
  parentId?: string; // For replies
  likesCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface CommentLike {
  userId: string;
  commentId: string;
  createdAt: Date;
}
```

#### 6. Notification System
**Files**: `src/app/api/mobile/notifications/`

```typescript
interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'task' | 'event' | 'devotional' | 'announcement' | 'prayer';
  entityId?: string;
  isRead: boolean;
  createdAt: Date;
}

interface FCMToken {
  userId: string;
  token: string;
  platform: 'android' | 'ios';
  isActive: boolean;
  updatedAt: Date;
}
```

---

## Database Schema Extensions

### New Collections/Tables Needed:

```typescript
// Devotionals
const DevotionalSchema = new Schema({
  title: { type: String, required: true },
  scripture: { type: String, required: true },
  content: { type: String, required: true },
  prayer: { type: String, required: true },
  date: { type: Date, required: true, unique: true },
  author: { type: String, required: true },
  likesCount: { type: Number, default: 0 },
  commentsCount: { type: Number, default: 0 },
  readCount: { type: Number, default: 0 }
}, { timestamps: true });

// Devotional Reads (for tracking streaks)
const DevotionalReadSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
  devotionalId: { type: Schema.Types.ObjectId, ref: 'Devotional', required: true },
  readAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Prayer Requests
const PrayerRequestSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  category: { type: String, enum: ['personal', 'family', 'church', 'nation'], required: true },
  isAnonymous: { type: Boolean, default: false },
  isPrivate: { type: Boolean, default: false },
  isAnswered: { type: Boolean, default: false },
  prayerCount: { type: Number, default: 0 },
  likesCount: { type: Number, default: 0 },
  commentsCount: { type: Number, default: 0 }
}, { timestamps: true });

// Comments (Universal)
const CommentSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
  entityType: { type: String, enum: ['blog', 'media', 'devotional', 'prayer'], required: true },
  entityId: { type: Schema.Types.ObjectId, required: true },
  content: { type: String, required: true },
  parentId: { type: Schema.Types.ObjectId, ref: 'Comment' }, // For replies
  likesCount: { type: Number, default: 0 },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

// Likes (Universal)
const LikeSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
  entityType: { type: String, enum: ['blog', 'media', 'devotional', 'prayer', 'comment'], required: true },
  entityId: { type: Schema.Types.ObjectId, required: true }
}, { timestamps: true });

// Notifications
const NotificationSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['task', 'event', 'devotional', 'announcement', 'prayer', 'comment'], required: true },
  entityId: { type: Schema.Types.ObjectId },
  isRead: { type: Boolean, default: false },
  data: { type: Schema.Types.Mixed } // Additional data for the notification
}, { timestamps: true });

// FCM Tokens
const FCMTokenSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
  token: { type: String, required: true },
  platform: { type: String, enum: ['android', 'ios'], required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });
```

---

## Implementation Priority

### Phase 1: Core User Features (Week 1-2)
1. ✅ Mobile authentication system
2. ✅ User profile management
3. ✅ User journey/dashboard
4. ✅ Basic team and task viewing

### Phase 2: Content & Engagement (Week 3-4)
1. ✅ Blog post viewing and commenting
2. ✅ Media viewing and commenting
3. ✅ Devotionals system
4. ✅ Gallery viewing

### Phase 3: Community Features (Week 5-6)
1. ✅ Prayer requests system
2. ✅ Community joining/leaving
3. ✅ Enhanced commenting system
4. ✅ Notification system

### Phase 4: Advanced Features (Week 7-8)
1. ✅ Real-time features (WebSocket)
2. ✅ Advanced search
3. ✅ Push notifications
4. ✅ File upload handling

---

## Security Considerations

### Mobile-Specific Security
1. **JWT Token Management**:
   - Shorter expiry times (15 minutes)
   - Refresh token rotation
   - Device fingerprinting

2. **Rate Limiting**:
   - More restrictive for mobile
   - Per-device limitations
   - Progressive delays

3. **Data Privacy**:
   - User can only access their own data
   - Community data filtered by membership
   - Anonymous options for sensitive content

### Example Mobile Token Verification:
```typescript
// src/lib/mobile-auth.ts
export async function verifyMobileToken(request: NextRequest) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    throw new Error('No token provided');
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const user = await Member.findById(decoded.userId);
    
    if (!user || !user.isActive) {
      throw new Error('Invalid user');
    }
    
    return user;
  } catch (error) {
    throw new Error('Invalid token');
  }
}
```

---

## Mobile-Specific Optimizations

### Data Response Optimization
```typescript
// Example: Mobile-optimized blog post response
function optimizeForMobile(blogPost: any) {
  return {
    id: blogPost._id,
    title: blogPost.title,
    excerpt: blogPost.content.substring(0, 200) + '...',
    author: {
      name: `${blogPost.author.firstName} ${blogPost.author.lastName}`,
      avatar: blogPost.author.avatar
    },
    featuredImage: blogPost.featuredImage,
    publishedAt: blogPost.createdAt,
    readTime: Math.ceil(blogPost.content.length / 200), // Rough estimate
    stats: {
      likes: blogPost.likesCount || 0,
      comments: blogPost.commentsCount || 0
    },
    isLiked: false // Will be determined by user context
  };
}
```

### Pagination Standards
```typescript
interface MobilePaginationResponse<T> {
  success: true;
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}
```

---

## Testing Strategy

### API Testing
1. **Unit Tests**: Each endpoint function
2. **Integration Tests**: Database operations
3. **Authentication Tests**: Token validation
4. **Performance Tests**: Response times < 500ms
5. **Security Tests**: Authorization checks

### Mobile-Specific Testing
1. **Offline Scenarios**: Graceful degradation
2. **Network Issues**: Retry mechanisms
3. **Battery Optimization**: Minimize background requests
4. **Data Usage**: Optimize payload sizes

---

This implementation guide provides a comprehensive roadmap for creating a robust mobile API that will power an engaging church mobile application. Each endpoint is designed with mobile-first principles while maintaining security and performance standards.
