import mongoose, { Document, Schema } from "mongoose";

export interface IStudentProfile extends Document {
  userId: mongoose.Types.ObjectId;
  classLevel: string;
  board: string; // Allow custom boards
  subjects: string[];
  preferredLanguage: string;
  learningStyle: "visual" | "auditory" | "reading" | "kinesthetic";
  studyGoalMinutes: number;
  streakDays: number;
  totalStudyMinutes: number;
  studyScore: number;
  weeklyScore: number;
  lastStudyDate?: Date;
  badges: string[];
  weakTopics: mongoose.Types.ObjectId[];
  powerHourEnds?: Date;
  powerHourTime?: string; // "HH:MM" — the daily time the user chose, e.g. "20:00"
  powerHourSetMonth?: number; // month (1-12) in which the choice was made; resets on 1st
  streakShields: number; // earned at every 7-day milestone; auto-consumed before streak reset
  createdAt: Date;
  updatedAt: Date;
}

const StudentProfileSchema = new Schema<IStudentProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    classLevel: {
      type: String,
      required: true,
      enum: [
        "Nursery",
        "LKG",
        "UKG",
        "Class 1",
        "Class 2",
        "Class 3",
        "Class 4",
        "Class 5",
        "Class 6",
        "Class 7",
        "Class 8",
        "Class 9",
        "Class 10",
        "Class 11",
        "Class 12",
      ],
    },
    board: {
      type: String,
      default: "CBSE",
    },
    subjects: [{ type: String }],
    preferredLanguage: { type: String, default: "English" },
    learningStyle: {
      type: String,
      enum: ["visual", "auditory", "reading", "kinesthetic"],
      default: "reading",
    },
    studyGoalMinutes: { type: Number, default: 60 },
    streakDays: { type: Number, default: 0 },
    totalStudyMinutes: { type: Number, default: 0 },
    studyScore: { type: Number, default: 0 },
    weeklyScore: { type: Number, default: 0 },
    lastStudyDate: { type: Date },
    badges: [{ type: String }],
    weakTopics: [{ type: Schema.Types.ObjectId, ref: "WeakTopic" }],
    powerHourEnds: { type: Date },
    powerHourTime: { type: String }, // "HH:MM"
    powerHourSetMonth: { type: Number }, // 1–12
    streakShields: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const StudentProfile = mongoose.model<IStudentProfile>(
  "StudentProfile",
  StudentProfileSchema,
);
