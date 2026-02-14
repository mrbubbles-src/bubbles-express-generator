import mongoose from 'mongoose';
import { env } from '../config/env.js';

let hasConnectionListeners = false;

const attachConnectionListeners = () => {
  if (hasConnectionListeners) {
    return;
  }

  mongoose.connection.on('connected', () =>
    console.log(`Connection with "${mongoose.connection.name}" DB established 🤖.`),
  );
  mongoose.connection.on('disconnected', () =>
    console.log(`Disconnected from "${mongoose.connection.name}" DB 🔌.`),
  );
  mongoose.connection.on('error', (error) =>
    console.log(`🚨 "${mongoose.connection.name}" DB Error:`, error),
  );

  hasConnectionListeners = true;
};

export default {
  connect: async () => {
    if (mongoose.connection.readyState === 1) {
      return;
    }

    attachConnectionListeners();
    await mongoose.connect(env.MONGO_DB_URI);
  },
  close: async () => {
    if (mongoose.connection.readyState === 0) {
      return;
    }

    await mongoose.disconnect();
  },
  ping: async () => {
    if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
      throw new Error('MongoDB is not connected');
    }

    await mongoose.connection.db.admin().ping();
  },
};
