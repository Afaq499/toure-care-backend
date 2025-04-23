import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const removeEmailUniqueIndex = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tour-care');
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }

    const collections = await db.collections();
    
    const userCollection = collections.find(col => col.collectionName === 'users');
    if (userCollection) {
      const indexes = await userCollection.indexes();
      const emailIndex = indexes.find(index => 
        index.key && 
        Object.keys(index.key).includes('email') && 
        index.unique === true
      );

      if (emailIndex) {
        await userCollection.dropIndex('email_1');
        console.log('Successfully removed unique index on email field');
      } else {
        console.log('No unique index found on email field');
      }
    }

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error removing email unique index:', error);
    process.exit(1);
  }
};

removeEmailUniqueIndex(); 