import mongoose from 'mongoose';

import { env } from './env.js';

export const connectToDatabase = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  await mongoose.connect(env.mongoUri, {
    autoIndex: true
  });

  console.log(`[api] Connected to MongoDB: ${env.mongoUri}`);
  return mongoose.connection;
};