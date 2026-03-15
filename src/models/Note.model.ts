import mongoose, { Document, Schema } from "mongoose";

export interface INote extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  subject: string;
  rawContent: string;
  cleanedContent?: string;
  structuredSummary?: string;
  missingConcepts?: string[];
  tags: string[];
  sourceType: "text" | "image" | "pdf";
  isProcessed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NoteSchema = new Schema<INote>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    subject: { type: String, required: true },
    rawContent: { type: String, required: true },
    cleanedContent: { type: String },
    structuredSummary: { type: String },
    missingConcepts: [{ type: String }],
    tags: [{ type: String }],
    sourceType: {
      type: String,
      enum: ["text", "image", "pdf"],
      default: "text",
    },
    isProcessed: { type: Boolean, default: false },
  },
  { timestamps: true },
);

NoteSchema.index({ userId: 1, subject: 1 });
NoteSchema.index({ userId: 1, createdAt: -1 });

export const Note = mongoose.model<INote>("Note", NoteSchema);
