import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User.model";
import { StudentProfile } from "../models/StudentProfile.model";
import { asyncHandler, createError } from "../middleware/errorHandler";

const signToken = (id: string, role: string, email: string): string => {
  return jwt.sign(
    { id, role, email },
    process.env.JWT_SECRET || "fallback_secret",
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" } as object,
  );
};

export const register = asyncHandler(async (req: Request, res: Response) => {
  const {
    name,
    email,
    password,
    role,
    classLevel,
    board,
    subjects,
    preferredLanguage,
  } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) throw createError("Email already registered", 409);

  const user = await User.create({
    name,
    email,
    password,
    role: role || "student",
  });

  // Auto-create student profile for students (with defaults if not provided)
  if (user.role === "student") {
    await StudentProfile.create({
      userId: user._id,
      classLevel: classLevel || "Class 6",
      board: board || "CBSE",
      subjects: subjects || [],
      preferredLanguage: preferredLanguage || "English",
    });
  }

  const token = signToken(String(user._id), user.role, user.email);

  res.status(201).json({
    success: true,
    message: "Registration successful",
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password)
    throw createError("Email and password are required", 400);

  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    throw createError("Invalid email or password", 401);
  }

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  const token = signToken(String(user._id), user.role, user.email);

  res.json({
    success: true,
    message: "Login successful",
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
});

export const getMe = asyncHandler(
  async (req: Request & { user?: { id: string } }, res: Response) => {
    const user = await User.findById(req.user?.id);
    if (!user) throw createError("User not found", 404);

    const profile = await StudentProfile.findOne({ userId: user._id });

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        profile,
      },
    });
  },
);

export const changePassword = asyncHandler(
  async (req: Request & { user?: { id: string } }, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user?.id).select("+password");
    if (!user) throw createError("User not found", 404);

    if (!(await user.comparePassword(currentPassword))) {
      throw createError("Current password is incorrect", 401);
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: "Password updated successfully" });
  },
);
