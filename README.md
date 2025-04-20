# Tour Care Admin Backend

This is the backend API for the Tour Care Admin application, built with Node.js, Express, and MongoDB.

## Features

- JWT Authentication
- User Registration and Login
- Protected Routes
- MongoDB Integration
- TypeScript Support

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory with the following variables:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/tour-care
JWT_SECRET=your-super-secret-key-change-this-in-production
JWT_EXPIRES_IN=24h
```

3. Start the development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
npm start
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (protected)

## Development

The project uses TypeScript for type safety and better development experience. The main files are:

- `src/index.ts` - Main server file
- `src/models/` - Database models
- `src/controllers/` - Route controllers
- `src/routes/` - API routes
- `src/middleware/` - Custom middleware

## Security

- Passwords are hashed using bcrypt
- JWT tokens are used for authentication
- Protected routes require valid JWT token
- Environment variables for sensitive data 
 