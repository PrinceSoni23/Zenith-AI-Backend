import mongoose, { Document, Schema } from "mongoose";

export interface IParentAccess extends Document {
  parentUserId: mongoose.Types.ObjectId;
  studentUserId: mongoose.Types.ObjectId;
  relationship: "father" | "mother" | "guardian";
  isApproved: boolean;
  canViewReports: boolean;
  canViewActivity: boolean;
  notifications: boolean;
  linkedAt: Date;
}

const ParentAccessSchema = new Schema<IParentAccess>(
  {
    parentUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    studentUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    relationship: {
      type: String,
      enum: ["father", "mother", "guardian"],
      default: "guardian",
    },
    isApproved: { type: Boolean, default: false },
    canViewReports: { type: Boolean, default: true },
    canViewActivity: { type: Boolean, default: true },
    notifications: { type: Boolean, default: true },
    linkedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

ParentAccessSchema.index(
  { parentUserId: 1, studentUserId: 1 },
  { unique: true },
);

export const ParentAccess = mongoose.model<IParentAccess>(
  "ParentAccess",
  ParentAccessSchema,
);
