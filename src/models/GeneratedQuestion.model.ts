import mongoose, { Document, Schema } from "mongoose";

export interface IGeneratedQuestion extends Document {
  userId: mongoose.Types.ObjectId;
  subject: string;
  topic: string;
  classLevel: string;
  questions: Array<{
    question: string;
    options?: string[];
    correctAnswer: string;
    explanation?: string;
    difficulty: "easy" | "medium" | "hard" | "thinking";
    type: "mcq" | "short" | "long" | "fill";
  }>;
  generatedAt: Date;
}

const GeneratedQuestionSchema = new Schema<IGeneratedQuestion>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    subject: { type: String, required: true },
    topic: { type: String, required: true },
    classLevel: { type: String, required: true },
    questions: [
      {
        question: { type: String, required: true },
        options: [{ type: String }],
        correctAnswer: { type: String, required: true },
        explanation: { type: String },
        difficulty: {
          type: String,
          enum: ["easy", "medium", "hard", "thinking"],
          default: "medium",
        },
        type: {
          type: String,
          enum: ["mcq", "short", "long", "fill"],
          default: "mcq",
        },
      },
    ],
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export const GeneratedQuestion = mongoose.model<IGeneratedQuestion>(
  "GeneratedQuestion",
  GeneratedQuestionSchema,
);
