import mongoose, { Document, Schema, Types } from 'mongoose';

export type EventStatus =
  | 'draft'
  | 'open'
  | 'submissions_closed'
  | 'judging'
  | 'voting'
  | 'ended';

export interface IPrize {
  place: number;
  title: string;
  description: string;
  value?: string;
  trackId?: Types.ObjectId;
}

export interface IEvent extends Document {
  title: string;
  description: string;
  bannerUrl?: string;
  organizerId: Types.ObjectId;
  status: EventStatus;
  registrationStart: Date;
  registrationEnd: Date;
  submissionStart: Date;
  submissionDeadline: Date;
  judgingStart?: Date;
  judgingEnd?: Date;
  votingStart?: Date;
  votingEnd?: Date;
  maxTeamSize: number;
  minTeamSize: number;
  allowSoloParticipants: boolean;
  prizes: IPrize[];
  rubricId?: Types.ObjectId;
  votingEnabled: boolean;
  resultsRevealed: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const PrizeSchema = new Schema<IPrize>({
  place: { type: Number, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  value: { type: String },
  trackId: { type: Schema.Types.ObjectId, ref: 'Track' },
});

const EventSchema = new Schema<IEvent>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    bannerUrl: { type: String },
    organizerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['draft', 'open', 'submissions_closed', 'judging', 'voting', 'ended'],
      default: 'draft',
    },
    registrationStart: { type: Date, required: true },
    registrationEnd: { type: Date, required: true },
    submissionStart: { type: Date, required: true },
    submissionDeadline: { type: Date, required: true },
    judgingStart: { type: Date },
    judgingEnd: { type: Date },
    votingStart: { type: Date },
    votingEnd: { type: Date },
    maxTeamSize: { type: Number, default: 4 },
    minTeamSize: { type: Number, default: 1 },
    allowSoloParticipants: { type: Boolean, default: true },
    prizes: [PrizeSchema],
    rubricId: { type: Schema.Types.ObjectId, ref: 'Rubric' },
    votingEnabled: { type: Boolean, default: false },
    resultsRevealed: { type: Boolean, default: false },
    tags: [{ type: String }],
  },
  { timestamps: true }
);

EventSchema.index({ status: 1 });
EventSchema.index({ organizerId: 1 });

export const Event = mongoose.model<IEvent>('Event', EventSchema);
