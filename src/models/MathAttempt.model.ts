import mongoose, { Document, Schema } from "mongoose";

export interface IMathAttempt extends Document {
  userId: mongoose.Types.ObjectId;
  problem: string;
  subject: string;
  topic: string;
  mode: "hint" | "step-by-step" | "full-solution";
  hints?: string[];
  steps?: string[];
  fullSolution?: string;
  userAnswer?: string;
  isCorrect?: boolean;
  timeSpentSeconds: number;
}

const MathAttemptSchema = new Schema<IMathAttempt>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    problem: { type: String, required: true },
    subject: { type: String, default: "Mathematics" },
    topic: { type: String, required: true },
    mode: {
      type: String,
      enum: ["hint", "step-by-step", "full-solution"],
      default: "step-by-step",
    },
    hints: [{ type: String }],
    steps: [{ type: String }],
    fullSolution: { type: String },
    userAnswer: { type: String },
    isCorrect: { type: Boolean },
    timeSpentSeconds: { type: Number, default: 0 },
  },
  { timestamps: true },
);

MathAttemptSchema.index({ userId: 1, topic: 1 });

export const MathAttempt = mongoose.model<IMathAttempt>(
  "MathAttempt",
  MathAttemptSchema,
);
