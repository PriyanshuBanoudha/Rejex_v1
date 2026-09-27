#!/bin/sh
set -e

echo "Waiting for MongoDB..."
until node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI || 'mongodb://mongo:27017/hackathon_platform')
  .then(() => { console.log('MongoDB ready'); process.exit(0); })
  .catch(() => process.exit(1));
" 2>/dev/null; do
  echo "MongoDB not ready yet, retrying in 2s..."
  sleep 2
done

echo "Running seed (skips if already seeded)..."
node -e "
const mongoose = require('mongoose');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://mongo:27017/hackathon_platform';
mongoose.connect(MONGODB_URI).then(async () => {
  const col = mongoose.connection.db.collection('users');
  const count = await col.countDocuments();
  if (count === 0) {
    console.log('DB empty, seeding...');
    process.exit(2);
  } else {
    console.log('DB already seeded, skipping.');
    process.exit(0);
  }
});
" || SEED_STATUS=$?

if [ "\$SEED_STATUS" = "2" ]; then
  node dist/seed/seed.js || echo "Seed script failed, continuing anyway..."
fi

echo "Starting server..."
exec node dist/server.js
