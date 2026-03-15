import mongoose, { Document, Schema } from "mongoose";

export interface IWeakTopic extends Document {
  userId: mongoose.Types.ObjectId;
  subject: string;
  topic: string;
  subtopic?: string;
  mistakeCount: number;
  lastAttempted?: Date;
  confidenceScore: number;
  needsRevision: boolean;
}

const WeakTopicSchema = new Schema<IWeakTopic>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    subject: { type: String, required: true },
    topic: { type: String, required: true },
    subtopic: { type: String },
    mistakeCount: { type: Number, default: 1 },
    lastAttempted: { type: Date },
    confidenceScore: { type: Number, default: 30, min: 0, max: 100 },
    needsRevision: { type: Boolean, default: true },
  },
  { timestamps: true },
);

WeakTopicSchema.index({ userId: 1, subject: 1 });
WeakTopicSchema.index({ userId: 1, needsRevision: 1 });

export const WeakTopic = mongoose.model<IWeakTopic>(
  "WeakTopic",
  WeakTopicSchema,
);
