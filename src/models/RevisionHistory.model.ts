import mongoose, { Document, Schema } from "mongoose";

export interface IRevisionHistory extends Document {
  userId: mongoose.Types.ObjectId;
  subject: string;
  topic: string;
  questions: Array<{
    question: string;
    answer: string;
    difficulty: string;
    isCorrect?: boolean;
  }>;
  sessionDate: Date;
  score: number;
  totalQuestions: number;
  timeSpentMinutes: number;
}

const RevisionHistorySchema = new Schema<IRevisionHistory>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    subject: { type: String, required: true },
    topic: { type: String, required: true },
    questions: [
      {
        question: { type: String, required: true },
        answer: { type: String, required: true },
        difficulty: { type: String, default: "medium" },
        isCorrect: { type: Boolean },
      },
    ],
    sessionDate: { type: Date, default: Date.now },
    score: { type: Number, default: 0 },
    totalQuestions: { type: Number, default: 0 },
    timeSpentMinutes: { type: Number, default: 0 },
  },
  { timestamps: true },
);

RevisionHistorySchema.index({ userId: 1, sessionDate: -1 });

export const RevisionHistory = mongoose.model<IRevisionHistory>(
  "RevisionHistory",
  RevisionHistorySchema,
);
