import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IRubricCriterion {
  _id?: Types.ObjectId;
  name: string;
  description: string;
  maxScore: number;
  weight: number;
}

export interface IRubric extends Document {
  eventId: Types.ObjectId;
  name: string;
  description?: string;
  criteria: IRubricCriterion[];
  totalWeight: number;
  createdAt: Date;
  updatedAt: Date;
}

const CriterionSchema = new Schema<IRubricCriterion>({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  maxScore: { type: Number, required: true, min: 1 },
  weight: { type: Number, required: true, min: 0.1 },
});

const RubricSchema = new Schema<IRubric>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    name: { type: String, required: true },
    description: { type: String },
    criteria: [CriterionSchema],
    totalWeight: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Auto-compute totalWeight before save
RubricSchema.pre('save', function (next) {
  this.totalWeight = this.criteria.reduce((sum, c) => sum + c.weight, 0);
  next();
});

export const Rubric = mongoose.model<IRubric>('Rubric', RubricSchema);
