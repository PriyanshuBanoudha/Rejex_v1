import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ICertificate extends Document {
  judgeId: Types.ObjectId;
  eventId: Types.ObjectId;
  recipientName: string;
  eventTitle: string;
  projectsJudged: number;
  issuedAt: Date;
  payload: string;        // JSON string of certificate data
  signature: string;      // hex-encoded Ed25519 signature
  publicKey: string;      // hex-encoded public key for verification
  certId: string;         // short unique ID for public URL
  pdfPath?: string;
  createdAt: Date;
}

const CertificateSchema = new Schema<ICertificate>(
  {
    judgeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    recipientName: { type: String, required: true },
    eventTitle: { type: String, required: true },
    projectsJudged: { type: Number, required: true },
    issuedAt: { type: Date, default: Date.now },
    payload: { type: String, required: true },
    signature: { type: String, required: true },
    publicKey: { type: String, required: true },
    certId: { type: String, required: true, unique: true },
    pdfPath: { type: String },
  },
  { timestamps: true }
);

CertificateSchema.index({ judgeId: 1, eventId: 1 });
CertificateSchema.index({ certId: 1 });

export const Certificate = mongoose.model<ICertificate>('Certificate', CertificateSchema);
