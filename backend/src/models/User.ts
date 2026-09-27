import mongoose, { Document, Schema } from 'mongoose';
import argon2 from 'argon2';

export type UserRole = 'admin' | 'organizer' | 'judge' | 'participant';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  bio?: string;
  avatarUrl?: string;
  resetToken?: string;
  resetExpiry?: Date;
  refreshToken?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, enum: ['admin', 'organizer', 'judge', 'participant'], default: 'participant' },
    bio: { type: String, default: '' },
    avatarUrl: { type: String, default: '' },
    resetToken: { type: String },
    resetExpiry: { type: Date },
    refreshToken: { type: String },
  },
  { timestamps: true }
);

UserSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return argon2.verify(this.passwordHash, candidate);
};

UserSchema.pre('save', async function (next) {
  if (this.isModified('passwordHash') && !this.passwordHash.startsWith('$argon2')) {
    this.passwordHash = await argon2.hash(this.passwordHash);
  }
  next();
});

export const User = mongoose.model<IUser>('User', UserSchema);
