import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IComment extends Document {
  authorId: Types.ObjectId;
  projectId: Types.ObjectId;
  eventId: Types.ObjectId;
  body: string;
  flagCount: number;
  flaggedBy: Types.ObjectId[];
  hidden: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    body: { type: String, required: true, maxlength: 2000 },
    flagCount: { type: Number, default: 0 },
    flaggedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    hidden: { type: Boolean, default: false },
  },
  { timestamps: true }
);

CommentSchema.index({ projectId: 1, hidden: 1 });

export const Comment = mongoose.model<IComment>('Comment', CommentSchema);
