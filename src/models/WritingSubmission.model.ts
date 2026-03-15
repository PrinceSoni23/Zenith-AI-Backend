import mongoose, { Document, Schema } from "mongoose";

export interface IWritingSubmission extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  subject: string;
  writingType: "essay" | "answer" | "story" | "letter" | "other";
  originalText: string;
  improvedText?: string;
  grammarFeedback?: string[];
  structureFeedback?: string;
  overallScore?: number;
  corrections?: Array<{
    original: string;
    corrected: string;
    explanation: string;
  }>;
}

const WritingSubmissionSchema = new Schema<IWritingSubmission>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    subject: { type: String, required: true },
    writingType: {
      type: String,
      enum: ["essay", "answer", "story", "letter", "other"],
      default: "answer",
    },
    originalText: { type: String, required: true },
    improvedText: { type: String },
    grammarFeedback: [{ type: String }],
    structureFeedback: { type: String },
    overallScore: { type: Number, min: 0, max: 100 },
    corrections: [
      {
        original: { type: String },
        corrected: { type: String },
        explanation: { type: String },
      },
    ],
  },
  { timestamps: true },
);

export const WritingSubmission = mongoose.model<IWritingSubmission>(
  "WritingSubmission",
  WritingSubmissionSchema,
);
