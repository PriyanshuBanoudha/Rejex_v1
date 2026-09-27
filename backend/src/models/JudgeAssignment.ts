import mongoose, { Document, Schema, Types } from 'mongoose';

export type AssignmentStatus = 'pending' | 'in_progress' | 'completed';

export interface IJudgeAssignment extends Document {
  eventId: Types.ObjectId;
  judgeId: Types.ObjectId;
  projectId: Types.ObjectId;
  trackId?: Types.ObjectId;
  status: AssignmentStatus;
  assignedAt: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const JudgeAssignmentSchema = new Schema<IJudgeAssignment>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    judgeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    trackId: { type: Schema.Types.ObjectId, ref: 'Track' },
    status: { type: String, enum: ['pending', 'in_progress', 'completed'], default: 'pending' },
    assignedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

JudgeAssignmentSchema.index({ eventId: 1, judgeId: 1 });
JudgeAssignmentSchema.index({ projectId: 1 });
JudgeAssignmentSchema.index({ judgeId: 1, status: 1 });
// Prevent duplicate assignments:
JudgeAssignmentSchema.index({ judgeId: 1, projectId: 1 }, { unique: true });

export const JudgeAssignment = mongoose.model<IJudgeAssignment>(
  'JudgeAssignment',
  JudgeAssignmentSchema
);
