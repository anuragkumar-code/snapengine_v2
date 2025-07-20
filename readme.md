
# 📘 SnapEngine API Documentation

_Last Updated: 2025-07-20_

---

## 🔐 Auth

### Login
`POST /api/auth/login`

**Request Body:**
```json
{
  "identifier": "user@example.com",
  "password": "yourpassword"
}
```

**Response:**
```json
{
  "success": true,
  "token": "JWT_TOKEN"
}
```

---

### Logout
`POST /api/auth/logout`  
🔒 Requires Auth

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

### Get Profile
`GET /api/auth/profile`  
🔒 Requires Auth

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Anurag"
  }
}
```

---

### Update Profile
`PUT /api/auth/profile`  
🔒 Requires Auth

**Request Body:**
```json
{
  "name": "New Name",
  "email": "newemail@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {}
}
```

---

## 🖼️ Photo Management

### Upload Photos
`POST /api/photos/upload`  
🔒 Requires Auth  
📎 Multipart/form-data

**Form Fields:**
- `album_id`: String
- `caption`: String
- `tags[]`: String (array)
- `photos`: File[] (multiple images)

**Response:**
```json
{
  "success": true,
  "message": "Photos added successfully",
  "data": []
}
```

---

## 📁 Album Sharing

### Share Album
`POST /api/album/:albumId/share`  
🔒 Requires Auth

**Request Body:**
```json
{
  "shared_with": 2,
  "permissions": {
    "can_view": true,
    "can_add": false,
    "can_edit": false,
    "can_delete": false,
    "can_comment": true,
    "can_download": true
  },
  "message": "Please check this out",
  "expires_at": "2025-12-31T23:59:59.999Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Album shared successfully",
  "data": {}
}
```

---

### Respond to Shared Album
`POST /api/album/share/:shareId/respond`  
🔒 Requires Auth

**Request Body:**
```json
{
  "response": "accepted" // or "declined"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Share accepted successfully",
  "data": {}
}
```

---

## 🧾 Authentication

All endpoints marked with 🔒 require the JWT token in the Authorization header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```
