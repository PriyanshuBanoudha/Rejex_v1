import mongoose from 'mongoose';
import argon2 from 'argon2';

async function main() {
  await mongoose.connect('mongodb://localhost:27017/hackathon_platform');
  const hash = await argon2.hash('Password123!');
  const col = mongoose.connection.collection('users');

  const users = [
    { email: 'admin@hackathon.local', name: 'Platform Admin', role: 'admin' },
    { email: 'admin@example.local', name: 'Platform Admin', role: 'admin' },
    { email: 'organizer@hackathon.local', name: 'Event Organizer', role: 'organizer' },
    { email: 'organizer@example.local', name: 'Event Organizer', role: 'organizer' },
    { email: 'judge1@hackathon.local', name: 'Alice Judge', role: 'judge' },
    { email: 'judge2@hackathon.local', name: 'Bob Judge', role: 'judge' },
    { email: 'judge3@hackathon.local', name: 'Carol Judge', role: 'judge' },
    { email: 'judge@example.local', name: 'Judge Example', role: 'judge' },
    { email: 'participant1@hackathon.local', name: 'Dave Builder', role: 'participant' },
    { email: 'participant2@hackathon.local', name: 'Eve Coder', role: 'participant' },
    { email: 'participant3@hackathon.local', name: 'Frank Dev', role: 'participant' },
    { email: 'participant4@hackathon.local', name: 'Grace Hacker', role: 'participant' },
    { email: 'participant@example.local', name: 'Participant Example', role: 'participant' },
  ];

  for (const u of users) {
    await col.updateOne(
      { email: u.email },
      { $set: { email: u.email, name: u.name, role: u.role, passwordHash: hash } },
      { upsert: true }
    );
  }

  console.log('Successfully updated roles and password hashes for all users.');
  await mongoose.disconnect();
}

main().catch(console.error);
