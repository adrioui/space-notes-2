# 🔌 Space Notes - API Reference

## 🎯 Overview

Space Notes provides a comprehensive REST API built with Next.js API routes. All endpoints require authentication unless specified otherwise.

**Base URL**: `https://space-notes-psi.vercel.app/api`

## 🔐 Authentication

### **Authentication Flow**
All API requests require a valid session token obtained through the authentication flow.

#### **Send OTP**
```http
POST /api/auth/send-otp
Content-Type: application/json

{
  "contact": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "isDemoAccount": false,
  "autoLogin": false
}
```

#### **Verify OTP**
```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "contact": "user@example.com",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "role": "member"
  },
  "isNewUser": false
}
```

## 👥 User Management

### **Get Current User**
```http
GET /api/users/me
Authorization: Bearer {session-token}
```

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "displayName": "User Name",
  "username": "username",
  "avatarType": "emoji",
  "avatarData": {
    "emoji": "👤",
    "backgroundColor": "#6366f1"
  }
}
```

### **Get User by ID**
```http
GET /api/users/{userId}
Authorization: Bearer {session-token}
```

## 🏠 Space Management

### **List User Spaces**
```http
GET /api/spaces
Authorization: Bearer {session-token}
```

**Response:**
```json
{
  "spaces": [
    {
      "id": "uuid",
      "name": "Space Name",
      "description": "Space description",
      "createdBy": "uuid",
      "inviteCode": "ABC123",
      "memberCount": 5,
      "role": "admin"
    }
  ]
}
```

### **Create Space**
```http
POST /api/spaces
Authorization: Bearer {session-token}
Content-Type: application/json

{
  "name": "New Space",
  "description": "Space description"
}
```

### **Get Space Details**
```http
GET /api/spaces/{spaceId}
Authorization: Bearer {session-token}
```

### **Join Space**
```http
POST /api/spaces/join/{inviteCode}
Authorization: Bearer {session-token}
```

### **Get Space Members**
```http
GET /api/spaces/{spaceId}/members
Authorization: Bearer {session-token}
```

**Response:**
```json
{
  "members": [
    {
      "userId": "uuid",
      "displayName": "User Name",
      "username": "username",
      "role": "admin",
      "joinedAt": "2024-01-01T00:00:00Z",
      "avatarData": {
        "emoji": "👤",
        "backgroundColor": "#6366f1"
      }
    }
  ]
}
```

## 💬 Messaging

### **Get Messages**
```http
GET /api/spaces/{spaceId}/messages
Authorization: Bearer {session-token}
```

**Query Parameters:**
- `limit`: Number of messages to return (default: 50)
- `before`: Get messages before this timestamp
- `after`: Get messages after this timestamp

**Response:**
```json
{
  "messages": [
    {
      "id": "uuid",
      "spaceId": "uuid",
      "userId": "uuid",
      "content": "Message content",
      "messageType": "text",
      "attachments": null,
      "createdAt": "2024-01-01T00:00:00Z",
      "user": {
        "id": "uuid",
        "displayName": "User Name",
        "username": "username",
        "avatarData": {
          "emoji": "👤",
          "backgroundColor": "#6366f1"
        }
      }
    }
  ],
  "hasMore": false
}
```

### **Send Message**
```http
POST /api/spaces/{spaceId}/messages
Authorization: Bearer {session-token}
Content-Type: application/json

{
  "content": "Message content",
  "messageType": "text",
  "attachments": null
}
```

### **Message Reactions**
```http
POST /api/messages/{messageId}/reactions
Authorization: Bearer {session-token}
Content-Type: application/json

{
  "emoji": "👍",
  "action": "add"
}
```

## 📝 Notes & Lessons

### **Get Space Notes**
```http
GET /api/spaces/{spaceId}/notes
Authorization: Bearer {session-token}
```

### **Create Note**
```http
POST /api/spaces/{spaceId}/notes
Authorization: Bearer {session-token}
Content-Type: application/json

{
  "title": "Note Title",
  "content": "Note content in markdown"
}
```

### **Get Space Lessons**
```http
GET /api/spaces/{spaceId}/lessons
Authorization: Bearer {session-token}
```

### **Update Lesson Progress**
```http
POST /api/lessons/{lessonId}/progress
Authorization: Bearer {session-token}
Content-Type: application/json

{
  "completed": true,
  "progress": 100
}
```

## 🎭 Demo System

### **Demo Health Check**
```http
GET /api/demo/health
```

**Response:**
```json
{
  "status": "healthy",
  "demo_users": {
    "found": 2,
    "missing": 0,
    "total_expected": 2
  },
  "users": [
    {
      "id": "uuid",
      "email": "demo-admin@example.com",
      "displayName": "Demo Admin"
    }
  ]
}
```

### **Create Demo Users**
```http
POST /api/demo/create-users
```

## 📊 Monitoring

### **System Health**
```http
GET /api/health
```

### **Monitoring Dashboard**
```http
GET /api/monitoring/dashboard
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "system": {
    "database": "connected",
    "realtime": "connected",
    "storage": "available"
  },
  "demo_accounts": {
    "status": "healthy",
    "count": 2
  },
  "metrics": {
    "total_users": 150,
    "total_spaces": 25,
    "total_messages": 1250
  }
}
```

## 🔄 Real-time Events

### **WebSocket Connection**
```javascript
// Connect to real-time updates
const supabase = createClient(url, key)
const channel = supabase.channel(`space:${spaceId}:messages`)

// Subscribe to message updates
channel
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `spaceId=eq.${spaceId}`
  }, (payload) => {
    console.log('New message:', payload.new)
  })
  .subscribe()
```

### **Event Types**
- **`postgres_changes`**: Database change events
- **`broadcast`**: Custom application events
- **`presence`**: User presence tracking

## ⚠️ Error Handling

### **Standard Error Response**
```json
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE",
  "details": {
    "field": "validation error details"
  }
}
```

### **HTTP Status Codes**
- **200**: Success
- **201**: Created
- **400**: Bad Request
- **401**: Unauthorized
- **403**: Forbidden
- **404**: Not Found
- **500**: Internal Server Error

## 🔒 Rate Limiting

### **Limits**
- **Authentication**: 10 requests per minute per IP
- **Messages**: 60 messages per minute per user
- **API Calls**: 1000 requests per hour per user

### **Headers**
```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1640995200
```

## 📋 Request/Response Examples

### **Complete Message Flow**
```javascript
// 1. Send message with optimistic update
const optimisticMessage = {
  id: 'temp-123',
  content: 'Hello world!',
  _optimistic: { deliveryState: 'sending' }
}

// 2. API request
const response = await fetch('/api/spaces/space-123/messages', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    content: 'Hello world!',
    messageType: 'text'
  })
})

// 3. Server response
const serverMessage = await response.json()
// { id: 'real-456', content: 'Hello world!', ... }

// 4. Real-time confirmation via WebSocket
// Optimistic message replaced with confirmed message
```

This API provides comprehensive functionality for all Space Notes features with real-time capabilities and robust error handling.
