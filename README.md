# HKids - Digital Reading Solution for Children

HKids is a child-friendly digital reading platform designed to provide young children with an immersive, independent reading experience.

## Project Overview

HKids addresses the challenge of providing consistent, age-appropriate reading experiences for young children, especially when parents have limited time. The platform offers:

- **Immersive Reading Experience**: Simulates natural book navigation with page turning
- **Age-Appropriate Content**: Controlled, validated content only
- **Content Management**: Admin interface for book upload and organization
- **Hardware-Agnostic**: Works on tablets and dedicated reading devices

## Technology Stack

### Frontend
- **React 18** with **Vite**: Modern, fast development and build
- **React Router**: Navigation
- **Tailwind CSS**: Styling
- **Framer Motion**: Smooth page turning animations

### Backend
- **Node.js** with **Express**: RESTful API
- **SQLite**: Lightweight database (easily upgradeable to PostgreSQL)
- **Multer**: File upload handling
- **JWT**: Admin authentication

### Architecture
- Modular design for easy expansion
- RESTful API architecture
- Separation of concerns (frontend/backend)

## Project Structure

```
HKids/
├── backend/          # Express API server
├── frontend/         # React application
├── docs/            # Technical documentation
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 18+ and npm

### Installation

1. Install all dependencies:
```bash
npm run install:all
```

2. Start the backend server:
```bash
npm run dev:backend
```

3. Start the frontend (in a new terminal):
```bash
npm run dev:frontend
```

### Default Access
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Admin Panel: http://localhost:5173/admin

Default admin credentials:
- Username: admin
- Password: admin123

## Features

### Reading Interface
- Page-by-page navigation
- Smooth page turning animations
- Age-appropriate content filtering
- Distraction-free reading environment

### Admin Panel
- Book upload (PDF, images)
- Content organization by category and age group
- Publication control
- User management

## Documentation

### Quick Start
- **[QUICK_START.md](./QUICK_START.md)** - Guide de démarrage rapide en 3 étapes
- **[SETUP.md](./SETUP.md)** - Guide de configuration détaillé

### Technical Documentation
- **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - Architecture technique complète
- **[docs/STACK_JUSTIFICATION.md](./docs/STACK_JUSTIFICATION.md)** - Justification du stack
- **[docs/API_DOCUMENTATION.md](./docs/API_DOCUMENTATION.md)** - Documentation API
- **[docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)** - Guide de déploiement
- **[docs/REQUIREMENTS_CHECKLIST.md](./docs/REQUIREMENTS_CHECKLIST.md)** - Vérification des exigences

### Project Status
- **[CHECKLIST.md](./CHECKLIST.md)** - Checklist complète de vérification
- **[PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)** - Résumé du projet

## ✅ Project Status

**✅ COMPLETE - 100% of requirements implemented**

All required deliverables have been completed:
- ✅ Functional POC with immersive reading interface
- ✅ Content management back-office
- ✅ Complete technical documentation
- ✅ Stack justification
- ✅ All functional requirements met
- ✅ All technical constraints satisfied

## Features Implemented

### Reading Interface
- ✅ Page-by-page navigation with smooth animations
- ✅ 3D page flip effects
- ✅ Touch support (swipe gestures)
- ✅ Keyboard navigation (arrow keys)
- ✅ Progress indicators
- ✅ Age and category filtering
- ✅ Distraction-free environment

### Admin Panel
- ✅ Secure authentication (JWT)
- ✅ Book management (CRUD)
- ✅ Category management (CRUD)
- ✅ File upload (cover + multiple pages)
- ✅ Publication control (draft/published)
- ✅ Age group organization
- ✅ Modern, intuitive interface

### Backend API
- ✅ RESTful API architecture
- ✅ Authentication endpoints
- ✅ Book management endpoints
- ✅ Category management endpoints
- ✅ File upload handling
- ✅ Input validation and security

## Technology Stack

### Frontend
- React 18 + Vite
- React Router
- Tailwind CSS
- Framer Motion
- Axios

### Backend
- Node.js + Express
- SQLite (easily migrable to PostgreSQL)
- JWT authentication
- Multer (file uploads)
- bcryptjs (password hashing)

## Project Structure

```
HKids/
├── backend/              # Express API server
│   ├── database/         # Database initialization
│   ├── routes/          # API routes
│   ├── uploads/         # Uploaded files
│   └── server.js        # Main server file
├── frontend/            # React application
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── context/     # React context
│   │   └── api/         # API client
│   └── ...
├── docs/                # Technical documentation
└── ...
```

## License

MIT

---

**Developed with care for children's digital reading experience** 📚✨

