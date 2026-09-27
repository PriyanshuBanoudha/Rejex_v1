import mongoose, { Document, Schema, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export type TeamStatus = 'forming' | 'locked';

export interface ITeam extends Document {
  eventId: Types.ObjectId;
  name: string;
  description?: string;
  inviteCode: string;
  leaderId: Types.ObjectId;
  members: Types.ObjectId[];
  status: TeamStatus;
  createdAt: Date;
  updatedAt: Date;
}

const TeamSchema = new Schema<ITeam>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    inviteCode: {
      type: String,
      unique: true,
      default: () => uuidv4().replace(/-/g, '').substring(0, 12).toUpperCase(),
    },
    leaderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    status: { type: String, enum: ['forming', 'locked'], default: 'forming' },
  },
  { timestamps: true }
);

TeamSchema.index({ eventId: 1 });
TeamSchema.index({ inviteCode: 1 });
TeamSchema.index({ members: 1 });

export const Team = mongoose.model<ITeam>('Team', TeamSchema);
