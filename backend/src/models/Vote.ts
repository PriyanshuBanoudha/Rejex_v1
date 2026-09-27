import mongoose, { Document, Schema, Types } from 'mongoose';
import crypto from 'crypto';

export interface IVote extends Document {
  voterId: Types.ObjectId;
  projectId: Types.ObjectId;
  eventId: Types.ObjectId;
  ipHash: string;
  userAgent?: string;
  createdAt: Date;
}

const VoteSchema = new Schema<IVote>(
  {
    voterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    ipHash: { type: String, required: true },
    userAgent: { type: String },
  },
  { timestamps: true }
);

// One vote per user per project
VoteSchema.index({ voterId: 1, projectId: 1 }, { unique: true });
VoteSchema.index({ eventId: 1, projectId: 1 });
// For IP abuse detection
VoteSchema.index({ ipHash: 1, eventId: 1 });

export function hashIp(ip: string, eventId: string): string {
  return crypto.createHash('sha256').update(`${ip}:${eventId}`).digest('hex');
}

export const Vote = mongoose.model<IVote>('Vote', VoteSchema);
