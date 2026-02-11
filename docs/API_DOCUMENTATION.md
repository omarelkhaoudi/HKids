# API Documentation - HKids

## Base URL

```
Development: http://localhost:3000/api
Production: https://api.hkids.com/api
```

## Authentication

Most admin endpoints require authentication via JWT token.

### Login

**POST** `/api/auth/login`

Request body:
```json
{
  "username": "admin",
  "password": "admin123"
}
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin"
  }
}
```

**Usage**: Include token in Authorization header for protected routes:
```
Authorization: Bearer <token>
```

---

## Books API

### Get Published Books (Public)

**GET** `/api/books/published`

Query parameters:
- `age_group` (optional): Filter by age (e.g., 5)
- `category_id` (optional): Filter by category ID

Response:
```json
[
  {
    "id": 1,
    "title": "The Adventure",
    "author": "John Doe",
    "description": "An exciting story",
    "cover_image": "/uploads/books/cover.jpg",
    "category_id": 1,
    "category_name": "Adventure",
    "age_group_min": 5,
    "age_group_max": 8,
    "page_count": 10,
    "is_published": 1,
    "created_at": "2024-01-01T00:00:00.000Z"
  }
]
```

### Get Single Book (Public)

**GET** `/api/books/:id`

Response:
```json
{
  "id": 1,
  "title": "The Adventure",
  "author": "John Doe",
  "description": "An exciting story",
  "cover_image": "/uploads/books/cover.jpg",
  "category_id": 1,
  "category_name": "Adventure",
  "age_group_min": 5,
  "age_group_max": 8,
  "page_count": 10,
  "is_published": 1,
  "pages": [
    {
      "id": 1,
      "book_id": 1,
      "page_number": 1,
      "image_path": "/uploads/books/page1.jpg",
      "content": null
    }
  ]
}
```

### Get All Books (Admin)

**GET** `/api/books`

**Requires**: Authentication

Response: Same format as published books, but includes unpublished books.

### Create Book (Admin)

**POST** `/api/books`

**Requires**: Authentication  
**Content-Type**: `multipart/form-data`

Form data:
- `title` (required): Book title
- `author` (optional): Author name
- `description` (optional): Book description
- `category_id` (optional): Category ID
- `age_group_min` (optional): Minimum age (default: 0)
- `age_group_max` (optional): Maximum age (default: 12)
- `is_published` (optional): "true" or "false" (default: false)
- `cover` (optional): Cover image file
- `pages` (optional): Multiple page image files

Response:
```json
{
  "id": 1,
  "message": "Book created successfully"
}
```

### Update Book (Admin)

**PUT** `/api/books/:id`

**Requires**: Authentication  
**Content-Type**: `multipart/form-data`

Form data: Same as create, all fields optional

Response:
```json
{
  "message": "Book updated successfully"
}
```

### Delete Book (Admin)

**DELETE** `/api/books/:id`

**Requires**: Authentication

Response:
```json
{
  "message": "Book deleted successfully"
}
```

---

## Categories API

### Get All Categories (Public)

**GET** `/api/categories`

Response:
```json
[
  {
    "id": 1,
    "name": "Adventure",
    "description": "Adventure stories",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
]
```

### Create Category (Admin)

**POST** `/api/categories`

**Requires**: Authentication

Request body:
```json
{
  "name": "Fantasy",
  "description": "Fantasy stories"
}
```

Response:
```json
{
  "id": 2,
  "name": "Fantasy",
  "description": "Fantasy stories"
}
```

### Update Category (Admin)

**PUT** `/api/categories/:id`

**Requires**: Authentication

Request body:
```json
{
  "name": "Fantasy",
  "description": "Updated description"
}
```

Response:
```json
{
  "message": "Category updated successfully"
}
```

### Delete Category (Admin)

**DELETE** `/api/categories/:id`

**Requires**: Authentication

Response:
```json
{
  "message": "Category deleted successfully"
}
```

---

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "error": "Error message description"
}
```

Common HTTP status codes:
- `400`: Bad Request (invalid input)
- `401`: Unauthorized (missing or invalid token)
- `404`: Not Found (resource doesn't exist)
- `500`: Internal Server Error

---

## Rate Limiting

Currently not implemented in POC. Should be added for production.

---

## File Upload Limits

- Maximum file size: 50MB per file
- Allowed types: JPEG, JPG, PNG, GIF, PDF
- Multiple files supported for pages

---

## Examples

### Using cURL

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

**Get Published Books:**
```bash
curl http://localhost:3000/api/books/published
```

**Create Book (with authentication):**
```bash
curl -X POST http://localhost:3000/api/books \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "title=My Book" \
  -F "author=Author Name" \
  -F "cover=@cover.jpg" \
  -F "pages=@page1.jpg" \
  -F "pages=@page2.jpg"
```

### Using JavaScript (Axios)

```javascript
import axios from 'axios';

// Login
const login = async () => {
  const response = await axios.post('/api/auth/login', {
    username: 'admin',
    password: 'admin123'
  });
  const token = response.data.token;
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

// Get books
const getBooks = async () => {
  const response = await axios.get('/api/books/published');
  return response.data;
};

// Create book
const createBook = async (formData) => {
  const response = await axios.post('/api/books', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};
```

