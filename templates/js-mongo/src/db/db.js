import mongoose from 'mongoose';
import 'dotenv/config';

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
    if (!process.env.MONGO_DB_URI) {
      throw new Error('MONGO_DB_URI environment variable is not set');
    }

    if (mongoose.connection.readyState === 1) {
      return;
    }

    attachConnectionListeners();
    await mongoose.connect(process.env.MONGO_DB_URI);
  },
  close: async () => {
    if (mongoose.connection.readyState === 0) {
      return;
    }

    await mongoose.disconnect();
  },
};
