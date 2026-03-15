import mongoose, { Document, Schema } from "mongoose";

export interface ITask extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  subject: string;
  taskType: "revise" | "read" | "solve" | "write" | "practice";
  estimatedMinutes: number;
  dueDate?: Date;
  isCompleted: boolean;
  completedAt?: Date;
  priority: "low" | "medium" | "high";
  generatedByAI: boolean;
  scoreReward: number;
}

const TaskSchema = new Schema<ITask>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    description: { type: String },
    subject: { type: String, required: true },
    taskType: {
      type: String,
      enum: ["revise", "read", "solve", "write", "practice"],
      default: "revise",
    },
    estimatedMinutes: { type: Number, default: 15 },
    dueDate: { type: Date },
    isCompleted: { type: Boolean, default: false },
    completedAt: { type: Date },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    generatedByAI: { type: Boolean, default: false },
    scoreReward: { type: Number, default: 10 },
  },
  { timestamps: true },
);

TaskSchema.index({ userId: 1, isCompleted: 1 });
TaskSchema.index({ userId: 1, dueDate: 1 });

export const Task = mongoose.model<ITask>("Task", TaskSchema);
