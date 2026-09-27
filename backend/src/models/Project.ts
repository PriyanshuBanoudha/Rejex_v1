import mongoose, { Document, Schema, Types } from 'mongoose';

export type ProjectStatus = 'draft' | 'submitted' | 'disqualified';

export interface IEditHistoryEntry {
  editedAt: Date;
  editedBy: Types.ObjectId;
  changeDescription: string;
}

export interface IProject extends Document {
  eventId: Types.ObjectId;
  teamId: Types.ObjectId;
  title: string;
  description: string;
  repoUrl?: string;
  demoUrl?: string;
  videoUrl?: string;
  slideUrl?: string;
  coverImageUrl?: string;
  trackId?: Types.ObjectId;
  tags: string[];
  status: ProjectStatus;
  submittedAt?: Date;
  editHistory: IEditHistoryEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const EditHistorySchema = new Schema<IEditHistoryEntry>({
  editedAt: { type: Date, default: Date.now },
  editedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  changeDescription: { type: String },
});

const ProjectSchema = new Schema<IProject>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    repoUrl: { type: String },
    demoUrl: { type: String },
    videoUrl: { type: String },
    slideUrl: { type: String },
    coverImageUrl: { type: String },
    trackId: { type: Schema.Types.ObjectId, ref: 'Track' },
    tags: [{ type: String }],
    status: { type: String, enum: ['draft', 'submitted', 'disqualified'], default: 'draft' },
    submittedAt: { type: Date },
    editHistory: [EditHistorySchema],
  },
  { timestamps: true }
);

ProjectSchema.index({ eventId: 1, status: 1 });
ProjectSchema.index({ teamId: 1 });
ProjectSchema.index({ trackId: 1 });
ProjectSchema.index({ title: 'text', description: 'text', tags: 'text' });

export const Project = mongoose.model<IProject>('Project', ProjectSchema);
