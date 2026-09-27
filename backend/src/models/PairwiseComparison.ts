import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IPairwiseComparison extends Document {
  judgeId: Types.ObjectId;
  eventId: Types.ObjectId;
  trackId?: Types.ObjectId;
  projectAId: Types.ObjectId;
  projectBId: Types.ObjectId;
  winnerId: Types.ObjectId;  // must be projectAId or projectBId
  confidence?: number;        // 1-5 optional confidence rating
  createdAt: Date;
}

const PairwiseSchema = new Schema<IPairwiseComparison>(
  {
    judgeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    trackId: { type: Schema.Types.ObjectId, ref: 'Track' },
    projectAId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    projectBId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    winnerId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    confidence: { type: Number, min: 1, max: 5 },
  },
  { timestamps: true }
);

PairwiseSchema.index({ eventId: 1 });
PairwiseSchema.index({ judgeId: 1, eventId: 1 });

export const PairwiseComparison = mongoose.model<IPairwiseComparison>(
  'PairwiseComparison',
  PairwiseSchema
);
