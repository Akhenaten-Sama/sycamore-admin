# Mobile App API Documentation

## Overview
This document outlines all API endpoints that the mobile application will consume for user-facing functionality. The mobile app provides an interactive platform for church members to engage with their community, track their spiritual journey, and participate in church activities.

## Base URL
```
https://your-domain.com/api
```

## Authentication
All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

---

## 1. Authentication & Account Management

### 1.1 User Registration/Signup
```http
POST /api/auth/mobile/register
```
**Description**: Create a new membership account

**Request Body**:
```json
{
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "phone": "string",
  "password": "string",
  "confirmPassword": "string",
  "dateOfBirth": "string (YYYY-MM-DD)",
  "address": "string (optional)",
  "emergencyContact": {
    "name": "string",
    "phone": "string",
    "relationship": "string"
  }
}
```

**Response**:
```json
{
  "success": true,
  "message": "Account created successfully. Please verify your email.",
  "data": {
    "userId": "string",
    "email": "string",
    "verificationRequired": true
  }
}
```

### 1.2 Email Verification
```http
POST /api/auth/mobile/verify-email
```
**Request Body**:
```json
{
  "email": "string",
  "verificationCode": "string"
}
```

### 1.3 User Login
```http
POST /api/auth/mobile/login
```
**Request Body**:
```json
{
  "email": "string",
  "password": "string"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "token": "string",
    "user": {
      "id": "string",
      "firstName": "string",
      "lastName": "string",
      "email": "string",
      "phone": "string",
      "avatar": "string (optional)",
      "teamId": "string (optional)",
      "isActive": true
    }
  }
}
```

### 1.4 Password Reset Request
```http
POST /api/auth/mobile/forgot-password
```

### 1.5 Password Reset Confirm
```http
POST /api/auth/mobile/reset-password
```

### 1.6 Refresh Token
```http
POST /api/auth/mobile/refresh
```

---

## 2. User Profile Management

### 2.1 Get User Profile
```http
GET /api/mobile/profile
```
**Response**:
```json
{
  "success": true,
  "data": {
    "id": "string",
    "firstName": "string",
    "lastName": "string",
    "email": "string",
    "phone": "string",
    "avatar": "string",
    "dateOfBirth": "string",
    "address": "string",
    "weddingAnniversary": "string (optional)",
    "maritalStatus": "string",
    "emergencyContact": {
      "name": "string",
      "phone": "string",
      "relationship": "string"
    },
    "dateJoined": "string",
    "isFirstTimer": false,
    "teamId": "string (optional)"
  }
}
```

### 2.2 Update User Profile
```http
PUT /api/mobile/profile
```
**Request Body**: (same as registration, all fields optional)

### 2.3 Upload Profile Picture
```http
POST /api/mobile/profile/avatar
```
**Request**: Multipart form with image file

---

## 3. User Journey & Statistics

### 3.1 Get User Journey/Dashboard
```http
GET /api/mobile/journey
```
**Response**:
```json
{
  "success": true,
  "data": {
    "stats": {
      "attendanceStreak": 5,
      "totalAttendance": 45,
      "devotionalStreak": 12,
      "totalGiving": 25000,
      "communitiesCount": 2,
      "tasksAssigned": 8,
      "tasksCompleted": 6
    },
    "recentActivities": [
      {
        "type": "attendance",
        "eventName": "Sunday Service",
        "date": "2025-09-01T10:00:00Z",
        "status": "present"
      }
    ],
    "upcomingEvents": [
      {
        "id": "string",
        "name": "Bible Study",
        "date": "2025-09-05T19:00:00Z",
        "location": "Church Hall"
      }
    ]
  }
}
```

### 3.2 Get Attendance History
```http
GET /api/mobile/attendance?limit=20&offset=0
```

### 3.3 Get Giving History
```http
GET /api/mobile/giving?limit=20&offset=0
```

---

## 4. Teams & Tasks

### 4.1 Get User Team Information
```http
GET /api/mobile/team
```
**Response**:
```json
{
  "success": true,
  "data": {
    "team": {
      "id": "string",
      "name": "string",
      "description": "string",
      "teamLead": {
        "id": "string",
        "firstName": "string",
        "lastName": "string",
        "avatar": "string"
      }
    },
    "members": [
      {
        "id": "string",
        "firstName": "string",
        "lastName": "string",
        "avatar": "string",
        "role": "member"
      }
    ],
    "memberCount": 8
  }
}
```

### 4.2 Get User Tasks
```http
GET /api/mobile/tasks?status=assigned&limit=20&offset=0
```
**Query Parameters**:
- `status`: open, assigned, in-progress, completed, cancelled
- `limit`: number of tasks per page
- `offset`: pagination offset

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "status": "assigned",
      "priority": "medium",
      "dueDate": "2025-09-10T00:00:00Z",
      "createdAt": "2025-09-01T10:00:00Z",
      "teamName": "string"
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 20,
    "offset": 0
  }
}
```

### 4.3 Update Task Status
```http
PUT /api/mobile/tasks/{taskId}/status
```
**Request Body**:
```json
{
  "status": "in-progress" // or "completed"
}
```

---

## 5. Communities

### 5.1 Get Available Communities
```http
GET /api/mobile/communities?type=life-group&limit=20&offset=0
```
**Query Parameters**:
- `type`: team, ministry, life-group, youth, choir, volunteer

### 5.2 Join Community
```http
POST /api/mobile/communities/{communityId}/join
```

### 5.3 Leave Community
```http
DELETE /api/mobile/communities/{communityId}/leave
```

### 5.4 Get User Communities
```http
GET /api/mobile/my-communities
```

---

## 6. Giving/Donations

### 6.1 Get Giving Options
```http
GET /api/mobile/giving/options
```
**Response**:
```json
{
  "success": true,
  "data": {
    "categories": [
      "tithe",
      "offering",
      "building_fund",
      "missions",
      "special_offering"
    ],
    "methods": [
      "cash",
      "bank_transfer",
      "mobile_money",
      "card"
    ]
  }
}
```

### 6.2 Record Giving
```http
POST /api/mobile/giving
```
**Request Body**:
```json
{
  "amount": 5000,
  "category": "tithe",
  "method": "bank_transfer",
  "reference": "TXN123456789",
  "notes": "Monthly tithe"
}
```

### 6.3 Get Giving Summary
```http
GET /api/mobile/giving/summary?year=2025
```

---

## 7. Blog Posts

### 7.1 Get Blog Posts
```http
GET /api/mobile/blog?category=sermon&limit=10&offset=0
```
**Query Parameters**:
- `category`: sermon, devotional, news, testimony
- `featured`: true/false
- `search`: search term

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "title": "string",
      "excerpt": "string",
      "content": "string",
      "author": {
        "name": "string",
        "avatar": "string"
      },
      "featuredImage": "string",
      "category": "sermon",
      "tags": ["faith", "prayer"],
      "publishedAt": "2025-09-01T10:00:00Z",
      "readTime": 5,
      "likesCount": 25,
      "commentsCount": 8,
      "isLiked": false
    }
  ]
}
```

### 7.2 Get Single Blog Post
```http
GET /api/mobile/blog/{postId}
```

### 7.3 Like/Unlike Blog Post
```http
POST /api/mobile/blog/{postId}/like
```

### 7.4 Get Blog Comments
```http
GET /api/mobile/blog/{postId}/comments?limit=20&offset=0
```

### 7.5 Add Blog Comment
```http
POST /api/mobile/blog/{postId}/comments
```
**Request Body**:
```json
{
  "content": "string",
  "parentId": "string (optional - for replies)"
}
```

### 7.6 Like/Unlike Comment
```http
POST /api/mobile/blog/comments/{commentId}/like
```

---

## 8. Media (Messages)

### 8.1 Get Media Library
```http
GET /api/mobile/media?type=sermon&limit=10&offset=0
```
**Query Parameters**:
- `type`: sermon, song, testimony, announcement
- `search`: search term

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "type": "sermon",
      "mediaUrl": "string",
      "thumbnailUrl": "string",
      "duration": "45:30",
      "speaker": "Pastor John",
      "uploadedAt": "2025-09-01T10:00:00Z",
      "viewCount": 150,
      "likesCount": 45,
      "commentsCount": 12,
      "isLiked": false,
      "tags": ["faith", "healing"]
    }
  ]
}
```

### 8.2 Get Single Media Item
```http
GET /api/mobile/media/{mediaId}
```

### 8.3 Track Media View
```http
POST /api/mobile/media/{mediaId}/view
```

### 8.4 Like/Unlike Media
```http
POST /api/mobile/media/{mediaId}/like
```

### 8.5 Get Media Comments
```http
GET /api/mobile/media/{mediaId}/comments?limit=20&offset=0
```

### 8.6 Add Media Comment
```http
POST /api/mobile/media/{mediaId}/comments
```

---

## 9. Gallery

### 9.1 Get Gallery Folders
```http
GET /api/mobile/gallery/folders
```

### 9.2 Get Gallery Images
```http
GET /api/mobile/gallery?folderId=string&limit=20&offset=0
```

### 9.3 Get Single Image
```http
GET /api/mobile/gallery/images/{imageId}
```

---

## 10. Devotionals

### 10.1 Get Daily Devotional
```http
GET /api/mobile/devotionals/today
```
**Response**:
```json
{
  "success": true,
  "data": {
    "id": "string",
    "title": "string",
    "scripture": "John 3:16",
    "content": "string",
    "prayer": "string",
    "date": "2025-09-04",
    "author": "string",
    "isRead": false,
    "readCount": 245,
    "likesCount": 89,
    "commentsCount": 23,
    "isLiked": false
  }
}
```

### 10.2 Get Devotional by Date
```http
GET /api/mobile/devotionals/{date} // YYYY-MM-DD
```

### 10.3 Mark Devotional as Read
```http
POST /api/mobile/devotionals/{devotionalId}/read
```

### 10.4 Get Devotional History
```http
GET /api/mobile/devotionals/history?limit=30&offset=0
```

### 10.5 Like/Unlike Devotional
```http
POST /api/mobile/devotionals/{devotionalId}/like
```

### 10.6 Get Devotional Comments
```http
GET /api/mobile/devotionals/{devotionalId}/comments?limit=20&offset=0
```

### 10.7 Add Devotional Comment
```http
POST /api/mobile/devotionals/{devotionalId}/comments
```

### 10.8 Get Devotional Streak
```http
GET /api/mobile/devotionals/streak
```

---

## 11. Events

### 11.1 Get Upcoming Events
```http
GET /api/mobile/events?upcoming=true&limit=10
```

### 11.2 Get Event Details
```http
GET /api/mobile/events/{eventId}
```

### 11.3 RSVP to Event
```http
POST /api/mobile/events/{eventId}/rsvp
```
**Request Body**:
```json
{
  "response": "yes" // yes, no, maybe
}
```

---

## 12. Announcements & Notifications

### 12.1 Get Announcements
```http
GET /api/mobile/announcements?limit=10&offset=0
```

### 12.2 Get User Notifications
```http
GET /api/mobile/notifications?limit=20&offset=0&unread=true
```

### 12.3 Mark Notification as Read
```http
PUT /api/mobile/notifications/{notificationId}/read
```

### 12.4 Update FCM Token
```http
PUT /api/mobile/notifications/fcm-token
```
**Request Body**:
```json
{
  "token": "string",
  "platform": "android" // or "ios"
}
```

---

## 13. Search

### 13.1 Global Search
```http
GET /api/mobile/search?q=prayer&type=all&limit=20
```
**Query Parameters**:
- `q`: search query
- `type`: all, blog, media, devotionals, members, events
- `limit`: results per type

---

## 14. Prayer Requests

### 14.1 Get Prayer Requests
```http
GET /api/mobile/prayers?category=personal&limit=20&offset=0
```

### 14.2 Submit Prayer Request
```http
POST /api/mobile/prayers
```
**Request Body**:
```json
{
  "title": "string",
  "content": "string",
  "category": "personal", // personal, family, church, nation
  "isAnonymous": false,
  "isPrivate": false
}
```

### 14.3 Pray for Request
```http
POST /api/mobile/prayers/{prayerId}/pray
```

---

## 15. Settings

### 15.1 Get App Settings
```http
GET /api/mobile/settings
```

### 15.2 Update Notification Preferences
```http
PUT /api/mobile/settings/notifications
```
**Request Body**:
```json
{
  "pushNotifications": true,
  "emailNotifications": true,
  "devotionalReminder": true,
  "eventReminders": true,
  "taskReminders": true
}
```

---

## Error Responses

All endpoints may return these error responses:

### 400 Bad Request
```json
{
  "success": false,
  "error": "Validation error message",
  "details": {
    "field": "error details"
  }
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Invalid or expired token"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "Access denied"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error"
}
```

---

## Real-time Features (WebSocket/Socket.IO)

### Connection
```javascript
const socket = io('wss://your-domain.com', {
  auth: {
    token: 'jwt_token'
  }
});
```

### Events to Listen For:
- `new_announcement` - New church announcements
- `task_assigned` - New task assigned to user
- `devotional_available` - New daily devotional
- `event_reminder` - Event starting soon
- `prayer_answered` - Prayer request updates
- `comment_reply` - Someone replied to user's comment

### Events to Emit:
- `join_prayer_room` - Join prayer request updates
- `leave_prayer_room` - Leave prayer request updates
- `typing_comment` - Show typing indicator

---

## File Upload Guidelines

### Image Uploads
- **Profile Pictures**: Max 5MB, formats: JPG, PNG, WebP
- **Comment Images**: Max 10MB, formats: JPG, PNG, WebP, GIF

### Audio/Video
- **Audio Comments**: Max 50MB, formats: MP3, M4A, WAV
- **Video Testimonies**: Max 100MB, formats: MP4, MOV

---

## Rate Limiting

- **Authentication endpoints**: 5 requests per minute
- **General API**: 100 requests per minute per user
- **File uploads**: 10 uploads per minute
- **Comments/Posts**: 20 per hour

---

## Caching Strategy

### Client-side Caching Recommendations:
- **User profile**: Cache for 1 hour
- **Devotionals**: Cache current day, pre-load next day
- **Media thumbnails**: Cache for 7 days
- **Blog posts**: Cache for 30 minutes
- **User journey stats**: Cache for 15 minutes

---

This API documentation provides a comprehensive foundation for building an interactive mobile church app. Each endpoint is designed to provide the necessary data while maintaining security and performance standards.
