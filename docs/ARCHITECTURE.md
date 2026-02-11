# HKids - Technical Architecture

## Overview

HKids is a child-friendly digital reading platform built with a modern, modular architecture that separates concerns between frontend and backend, ensuring scalability, maintainability, and hardware-agnostic deployment.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │  Reading App     │         │  Admin Panel     │         │
│  │  (React + Vite)  │         │  (React + Vite)  │         │
│  └──────────────────┘         └──────────────────┘         │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/REST API
                            │
┌─────────────────────────────────────────────────────────────┐
│                      API Layer (Express)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Auth    │  │  Books   │  │Categories│  │  Files   │   │
│  │  Routes  │  │  Routes  │  │  Routes  │  │  Storage │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                                │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │   SQLite DB      │         │  File System     │         │
│  │  (Books, Users,  │         │  (Images, PDFs)  │         │
│  │   Categories)    │         │                  │         │
│  └──────────────────┘         └──────────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend

**React 18 with Vite**
- **Rationale**: Modern, fast development experience with hot module replacement
- **Benefits**: 
  - Fast build times
  - Excellent developer experience
  - Small bundle size
  - Wide browser support

**React Router**
- **Rationale**: Client-side routing for SPA navigation
- **Benefits**: Smooth transitions, no page reloads

**Tailwind CSS**
- **Rationale**: Utility-first CSS framework
- **Benefits**: 
  - Rapid UI development
  - Consistent design system
  - Small production bundle (purged unused styles)

**Framer Motion**
- **Rationale**: Animation library for smooth page transitions
- **Benefits**: 
  - Smooth page turning animations
  - Enhances reading experience
  - Performance-optimized

**Axios**
- **Rationale**: HTTP client for API communication
- **Benefits**: Promise-based, interceptors, error handling

### Backend

**Node.js with Express**
- **Rationale**: 
  - JavaScript ecosystem consistency (frontend + backend)
  - Large ecosystem of packages
  - Excellent performance for I/O operations
  - Easy deployment
- **Benefits**:
  - Fast development
  - Scalable architecture
  - RESTful API design

**SQLite**
- **Rationale**: 
  - Zero-configuration database
  - Perfect for POC and small-to-medium deployments
  - File-based, easy backup
  - Can easily migrate to PostgreSQL for production
- **Benefits**:
  - No separate database server needed
  - Lightweight
  - ACID compliant
  - Easy to upgrade

**Multer**
- **Rationale**: File upload handling middleware
- **Benefits**: Handles multipart/form-data efficiently

**JWT (jsonwebtoken)**
- **Rationale**: Stateless authentication
- **Benefits**: 
  - Scalable
  - Secure
  - No server-side session storage needed

**bcryptjs**
- **Rationale**: Password hashing
- **Benefits**: Industry-standard security

## Database Schema

### Users Table
```sql
- id (INTEGER PRIMARY KEY)
- username (TEXT UNIQUE)
- password (TEXT - hashed)
- role (TEXT - default 'admin')
- created_at (DATETIME)
```

### Categories Table
```sql
- id (INTEGER PRIMARY KEY)
- name (TEXT)
- description (TEXT)
- created_at (DATETIME)
```

### Books Table
```sql
- id (INTEGER PRIMARY KEY)
- title (TEXT)
- author (TEXT)
- description (TEXT)
- cover_image (TEXT - path)
- file_path (TEXT)
- category_id (INTEGER - FK)
- age_group_min (INTEGER)
- age_group_max (INTEGER)
- page_count (INTEGER)
- is_published (INTEGER - boolean)
- created_at (DATETIME)
- updated_at (DATETIME)
```

### Book Pages Table
```sql
- id (INTEGER PRIMARY KEY)
- book_id (INTEGER - FK)
- page_number (INTEGER)
- image_path (TEXT)
- content (TEXT)
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login

### Books
- `GET /api/books/published` - Get published books (public)
- `GET /api/books/:id` - Get single book with pages
- `GET /api/books` - Get all books (admin)
- `POST /api/books` - Create book (admin)
- `PUT /api/books/:id` - Update book (admin)
- `DELETE /api/books/:id` - Delete book (admin)

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category (admin)
- `PUT /api/categories/:id` - Update category (admin)
- `DELETE /api/categories/:id` - Delete category (admin)

## Security Considerations

1. **Authentication**: JWT tokens for admin access
2. **Password Hashing**: bcrypt with salt rounds
3. **File Upload**: Type validation, size limits
4. **CORS**: Configured for development (should be restricted in production)
5. **Input Validation**: Required on both client and server

## Scalability & Performance

### Current (POC)
- SQLite for simplicity
- File-based storage for uploads
- Single-threaded Node.js (sufficient for POC)

### Production Recommendations
1. **Database**: Migrate to PostgreSQL for better concurrency
2. **File Storage**: Use cloud storage (AWS S3, Cloudinary)
3. **Caching**: Redis for session management and frequently accessed data
4. **CDN**: Serve static assets and images via CDN
5. **Load Balancing**: Multiple Node.js instances behind a load balancer
6. **Image Optimization**: Automatic image resizing/compression

## Hardware Compatibility

The solution is designed to be hardware-agnostic:

1. **Web-based**: Runs in any modern browser
2. **Responsive Design**: Works on tablets, dedicated devices, desktops
3. **Touch-friendly**: Large buttons, swipe gestures (can be added)
4. **Offline Capability**: Can be enhanced with Service Workers for offline reading

## Deployment Options

### Development
- Local development with hot reload
- SQLite database file
- Local file storage

### Production
1. **Traditional Server**: Node.js on Linux server
2. **Container**: Docker containerization
3. **Cloud Platform**: AWS, Google Cloud, Azure
4. **Serverless**: AWS Lambda + API Gateway (with modifications)

## Future Enhancements

1. **Audio Narration**: Text-to-speech or pre-recorded audio
2. **Parental Dashboard**: Reading progress tracking
3. **Offline Mode**: Service Workers for offline reading
4. **Multi-language Support**: i18n implementation
5. **Reading Analytics**: Track reading time, completion rates
6. **Interactive Elements**: Touch interactions, animations
7. **Search Functionality**: Full-text search for books

## File Structure

```
HKids/
├── backend/
│   ├── database/
│   │   └── init.js          # Database initialization
│   ├── routes/
│   │   ├── auth.js          # Authentication routes
│   │   ├── books.js         # Book management routes
│   │   └── categories.js    # Category routes
│   ├── uploads/             # File storage
│   └── server.js            # Express server
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── context/         # React context (Auth)
│   │   ├── api/             # API client functions
│   │   └── App.jsx          # Main app component
│   └── public/              # Static assets
├── docs/                    # Documentation
└── README.md
```

## Performance Metrics (Expected)

- **Initial Load**: < 2s on 3G connection
- **Page Navigation**: < 100ms
- **API Response**: < 200ms (local network)
- **Image Loading**: Progressive loading with placeholders

## Conclusion

This architecture provides a solid foundation for a child-friendly reading platform that is:
- **Modular**: Easy to extend and maintain
- **Scalable**: Can grow with user base
- **Secure**: Proper authentication and validation
- **Hardware-agnostic**: Works on various devices
- **Developer-friendly**: Modern stack with good DX

