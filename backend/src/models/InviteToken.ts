import mongoose, { Document, Schema, Types } from 'mongoose';

export type InviteRole = 'judge' | 'organizer' | 'participant';

export interface IInviteToken extends Document {
  token: string;
  eventId: Types.ObjectId;
  role: InviteRole;
  createdBy: Types.ObjectId;
  usedBy?: Types.ObjectId;
  usedAt?: Date;
  expiresAt: Date;
  maxUses: number;
  useCount: number;
  createdAt: Date;
}

const InviteTokenSchema = new Schema<IInviteToken>(
  {
    token: { type: String, required: true, unique: true },
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    role: { type: String, enum: ['judge', 'organizer', 'participant'], required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    usedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    usedAt: { type: Date },
    expiresAt: { type: Date, required: true },
    maxUses: { type: Number, default: 1 },
    useCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

InviteTokenSchema.index({ token: 1 });
InviteTokenSchema.index({ eventId: 1, role: 1 });

export const InviteToken = mongoose.model<IInviteToken>('InviteToken', InviteTokenSchema);
