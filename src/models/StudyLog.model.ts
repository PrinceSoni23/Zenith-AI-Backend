import mongoose, { Document, Schema } from "mongoose";

export interface IStudyLog extends Document {
  userId: mongoose.Types.ObjectId;
  subject: string;
  topic: string;
  moduleUsed: string;
  durationMinutes: number;
  date: Date;
  agentUsed?: string;
  inputSummary?: string;
  outputSummary?: string;
  scoreEarned: number;
  completedTasks: string[];
}

const StudyLogSchema = new Schema<IStudyLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    subject: { type: String, required: true },
    topic: { type: String, required: true },
    moduleUsed: { type: String, required: true },
    durationMinutes: { type: Number, default: 0 },
    date: { type: Date, default: Date.now },
    agentUsed: { type: String },
    inputSummary: { type: String },
    outputSummary: { type: String },
    scoreEarned: { type: Number, default: 0 },
    completedTasks: [{ type: String }],
  },
  { timestamps: true },
);

StudyLogSchema.index({ userId: 1, date: -1 });
StudyLogSchema.index({ userId: 1, subject: 1 });

export const StudyLog = mongoose.model<IStudyLog>("StudyLog", StudyLogSchema);
