import mongoose from 'mongoose';
import app from './app';
import { config } from './config';

const start = async () => {
  try {
    await mongoose.connect(config.MONGODB_URI);
    console.log(`[MongoDB] Connected to ${config.MONGODB_URI}`);

    app.listen(config.PORT, () => {
      console.log(`[Server] Running on port ${config.PORT} (${config.NODE_ENV})`);
    });
  } catch (err) {
    console.error('[Server] Failed to start:', err);
    process.exit(1);
  }
};

process.on('SIGTERM', async () => {
  await mongoose.disconnect();
  process.exit(0);
});

start();
