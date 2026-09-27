import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ICriterionScore {
  criterionId: Types.ObjectId;
  rawScore: number;
  comment?: string;
}

export interface IScore extends Document {
  judgeId: Types.ObjectId;
  projectId: Types.ObjectId;
  eventId: Types.ObjectId;
  rubricId: Types.ObjectId;
  assignmentId: Types.ObjectId;
  criteriaScores: ICriterionScore[];
  totalRawScore: number;
  weightedScore: number;
  normalizedScore: number;   // 0-100 weighted rubric score
  zScore?: number;           // cross-judge z-score
  finalScore?: number;       // public-facing score after normalization
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CriterionScoreSchema = new Schema<ICriterionScore>({
  criterionId: { type: Schema.Types.ObjectId, required: true },
  rawScore: { type: Number, required: true, min: 0 },
  comment: { type: String },
});

const ScoreSchema = new Schema<IScore>(
  {
    judgeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    rubricId: { type: Schema.Types.ObjectId, ref: 'Rubric', required: true },
    assignmentId: { type: Schema.Types.ObjectId, ref: 'JudgeAssignment', required: true },
    criteriaScores: [CriterionScoreSchema],
    totalRawScore: { type: Number, default: 0 },
    weightedScore: { type: Number, default: 0 },
    normalizedScore: { type: Number, default: 0 },
    zScore: { type: Number },
    finalScore: { type: Number },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

ScoreSchema.index({ eventId: 1, projectId: 1 });
ScoreSchema.index({ judgeId: 1, eventId: 1 });
// One score per judge per project
ScoreSchema.index({ judgeId: 1, projectId: 1 }, { unique: true });

export const Score = mongoose.model<IScore>('Score', ScoreSchema);
