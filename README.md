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
- **PostgreSQL**: Database
- **Multer**: File upload handling
- **JWT**: Admin authentication

### Architecture
- Modular design for easy expansion
- RESTful API architecture
- Separation of concerns (frontend/backend)

## Project Structure

```
HKids/
├── backend/              # Express API server
│   ├── config/          # Configuration files
│   ├── database/         # Database initialization
│   ├── middleware/       # Express middleware
│   ├── routes/           # API routes
│   ├── scripts/          # Utility scripts
│   ├── uploads/          # Uploaded files
│   └── server.js         # Main server file
├── frontend/             # React application
│   ├── src/
│   │   ├── api/         # API client
│   │   ├── components/  # React components
│   │   ├── context/     # React context
│   │   ├── pages/       # Page components
│   │   └── utils/       # Utility functions
│   └── public/          # Static assets
├── scripts/              # Project scripts
│   └── windows/         # Windows PowerShell scripts
├── docs/                 # Documentation
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 12+ (running on port 5432)

### Installation

1. Install all dependencies:
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

2. Configure the backend:
```bash
# Copy the example environment file
cd backend
cp env.example .env

# Edit .env with your PostgreSQL credentials:
# DB_HOST=localhost
# DB_PORT=5432
# DB_USER=postgres
# DB_PASSWORD=your_password
# DB_NAME=hkids
```

3. Create the database:
```sql
CREATE DATABASE hkids;
```

4. Start the application:

**Windows:**
```powershell
.\scripts\windows\start.ps1
```

**Manual start:**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
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

### Technical Documentation
- **[docs/LE_LIT_QUI_LIT_GAP_ANALYSIS.md](./docs/LE_LIT_QUI_LIT_GAP_ANALYSIS.md)** - Analyse du nouveau cahier des charges Le Lit Qui Lit
- **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - Architecture technique
- **[docs/STACK_JUSTIFICATION.md](./docs/STACK_JUSTIFICATION.md)** - Justification du stack
- **[docs/API_DOCUMENTATION.md](./docs/API_DOCUMENTATION.md)** - Documentation API
- **[docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)** - Guide de déploiement

## Project Status

**POC lecture avance - nouvelle roadmap produit a cadrer**

Le projet couvre deja une base importante de lecture numerique, d'administration, de profils parents/enfants, de controle par categories, de suivi de lecture et d'abonnements. Le nouveau cahier des charges "Le Lit Qui Lit" ajoute des exigences majeures qui ne sont pas encore terminees: audio, assistant vocal IA, clonage vocal parental, mode hors connexion, contenus multilingues structures, consentement vocal et experience enfant non lectrice.

Voir l'analyse detaillee: [docs/LE_LIT_QUI_LIT_GAP_ANALYSIS.md](./docs/LE_LIT_QUI_LIT_GAP_ANALYSIS.md).

Base POC deja implementee:
- ✅ Functional POC with immersive reading interface
- ✅ Content management back-office
- ✅ Complete technical documentation
- ✅ Stack justification
- ✅ Parent/kid/admin roles
- ✅ Parent controls by categories
- ✅ Reading progress and subscription foundation

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
- PostgreSQL
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

