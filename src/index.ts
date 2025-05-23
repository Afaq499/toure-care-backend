import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import agentRoutes from './routes/agent.routes';
import productRoutes from './routes/product.routes';
import memberRoutes from './routes/member.routes';
import taskRoutes from './routes/task.routes';
import userRoutes from './routes/user.routes';
import accountRoutes from './routes/account.routes';

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: true, // reflect the request origin
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', agentRoutes);
app.use('/api/products', productRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);
app.use('/api/accounts', accountRoutes);

// Database connection
mongoose.connect(process.env.MONGODB_URI!)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 