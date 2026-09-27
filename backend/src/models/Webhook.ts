import mongoose, { Document, Schema, Types } from 'mongoose';

export type WebhookEvent =
  | 'project.submitted'
  | 'project.updated'
  | 'score.submitted'
  | 'vote.cast'
  | 'event.status_changed'
  | 'judge.assigned'
  | 'results.revealed';

export interface IWebhook extends Document {
  eventId: Types.ObjectId;
  url: string;
  events: WebhookEvent[];
  secret: string;
  active: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const WebhookSchema = new Schema<IWebhook>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    url: { type: String, required: true },
    events: [{ type: String }],
    secret: { type: String, required: true },
    active: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

WebhookSchema.index({ eventId: 1 });

export const Webhook = mongoose.model<IWebhook>('Webhook', WebhookSchema);
