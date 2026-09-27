import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAuditLog extends Document {
  actorId?: Types.ObjectId;
  actorEmail?: string;
  action: string;
  resource: string;
  resourceId?: string;
  eventId?: Types.ObjectId;
  payload?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    actorId: { type: Schema.Types.ObjectId, ref: 'User' },
    actorEmail: { type: String },
    action: { type: String, required: true },
    resource: { type: String, required: true },
    resourceId: { type: String },
    eventId: { type: Schema.Types.ObjectId, ref: 'Event' },
    payload: { type: Schema.Types.Mixed },
    ip: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true, versionKey: false }
);

AuditLogSchema.index({ eventId: 1, createdAt: -1 });
AuditLogSchema.index({ actorId: 1 });
AuditLogSchema.index({ action: 1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
