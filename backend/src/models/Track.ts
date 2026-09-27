import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ITrack extends Document {
  eventId: Types.ObjectId;
  name: string;
  description: string;
  prizes: Array<{ place: number; title: string; value?: string }>;
  createdAt: Date;
  updatedAt: Date;
}

const TrackSchema = new Schema<ITrack>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    prizes: [
      {
        place: { type: Number },
        title: { type: String },
        value: { type: String },
      },
    ],
  },
  { timestamps: true }
);

TrackSchema.index({ eventId: 1 });

export const Track = mongoose.model<ITrack>('Track', TrackSchema);
