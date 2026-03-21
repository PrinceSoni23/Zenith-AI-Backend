import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";

export interface IParent extends Document {
  name: string;
  email: string;
  password: string;
  phone?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const ParentSchema = new Schema<IParent>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 8,
      select: false,
    },
    phone: {
      type: String,
      trim: true,
    },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
  },
  { timestamps: true },
);

// Hash password before saving (only if password is not already hashed)
ParentSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  // Check if password is already hashed (bcrypt hashes are ~60 chars)
  if (this.password.length === 60 && this.password.startsWith("$2")) {
    console.log("[ParentSchema] Password already hashed, skipping re-hash");
    return next();
  }

  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare passwords
ParentSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

export const Parent = mongoose.model<IParent>("Parent", ParentSchema);
