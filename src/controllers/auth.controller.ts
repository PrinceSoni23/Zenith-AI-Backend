import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User.model";
import { Parent } from "../models/Parent.model";
import { StudentProfile } from "../models/StudentProfile.model";
import { asyncHandler, createError } from "../middleware/errorHandler";
import {
  validateEmail,
  validatePassword,
  validateString,
} from "../utils/validators";

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

  console.log("[AUTH] Register request - role received:", role);

  // Validate email
  const emailValidation = validateEmail(email);
  if (!emailValidation.valid) {
    throw createError(emailValidation.error || "Invalid email", 400);
  }

  // Validate password strength
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    throw createError(passwordValidation.error || "Invalid password", 400);
  }

  // Validate name
  const nameValidation = validateString(name, "name", 2, 100);
  if (!nameValidation.valid) {
    throw createError(nameValidation.error || "Invalid name", 400);
  }

  const finalRole = role || "student";

  // Validate role enum
  if (!["student", "parent"].includes(finalRole)) {
    throw createError("Role must be 'student' or 'parent'", 400);
  }

  // Check if email already exists in BOTH collections
  const [existingParent, existingStudent] = await Promise.all([
    Parent.findOne({ email: emailValidation.value }),
    User.findOne({ email: emailValidation.value }),
  ]);

  if (existingParent || existingStudent) {
    console.log("[AUTH] Email already registered:", emailValidation.value);
    throw createError("Email already registered", 409);
  }

  let user: any;

  // Create in appropriate collection
  if (finalRole === "parent") {
    console.log("[AUTH] Creating parent account in PARENT collection");
    user = await Parent.create({
      name,
      email,
      password,
    });
  } else {
    console.log("[AUTH] Creating student account in STUDENT collection");
    user = await User.create({
      name,
      email,
      password,
      role: "student",
    });

    // Auto-create student profile
    await StudentProfile.create({
      userId: user._id,
      classLevel: classLevel || "Class 6",
      board: board || "CBSE",
      subjects: subjects || [],
      preferredLanguage: preferredLanguage || "English",
    });
  }

  console.log(
    "[AUTH] User created with role:",
    finalRole,
    "in appropriate collection",
  );

  const token = signToken(String(user._id), finalRole, user.email);

  res.status(201).json({
    success: true,
    message: "Registration successful",
    token,
    user: { id: user._id, name: user.name, email: user.email, role: finalRole },
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, role } = req.body;

  console.log("[AUTH] Login attempt with email:", email);
  console.log("[AUTH] Login - role selected by user:", role);

  if (!email || !password)
    throw createError("Email and password are required", 400);

  const finalRole = role || "student";

  // Check BOTH collections to see where this email exists
  const [parentAccount, studentAccount] = await Promise.all([
    Parent.findOne({ email }).select("+password"),
    User.findOne({ email }).select("+password"),
  ]);

  console.log("[AUTH] Parent account found:", !!parentAccount);
  console.log("[AUTH] Student account found:", !!studentAccount);

  // Determine actual account location
  let user: any = null;
  let actualRole: string = "";

  if (parentAccount && studentAccount) {
    // Email exists in both - error (shouldn't happen)
    throw createError("Account data conflict. Please contact support.", 500);
  } else if (parentAccount) {
    // Account is in Parent collection
    user = parentAccount;
    actualRole = "parent";
    console.log("[AUTH] Account found in PARENT collection");
  } else if (studentAccount) {
    // Account is in User collection
    user = studentAccount;
    actualRole = "student";
    console.log("[AUTH] Account found in STUDENT collection");
  } else {
    // Account not found anywhere
    throw createError("Invalid email or password", 401);
  }

  // Verify selected role matches actual account location
  if (finalRole !== actualRole) {
    console.log(
      `[AUTH] Role mismatch! Selected: ${finalRole}, Actual: ${actualRole}`,
    );
    throw createError(
      `This account is registered as a ${actualRole}. Please select "${actualRole}" to login.`,
      403,
    );
  }

  // Verify password
  if (!(await user.comparePassword(password))) {
    throw createError("Invalid email or password", 401);
  }

  console.log("[AUTH] Password verified");

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  const token = signToken(String(user._id), actualRole, user.email);

  console.log("[AUTH] Login successful - role:", actualRole);

  res.json({
    success: true,
    message: "Login successful",
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: actualRole,
    },
  });
});

export const getMe = asyncHandler(
  async (
    req: Request & { user?: { id: string; role: string } },
    res: Response,
  ) => {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    console.log("[AUTH] getMe - userId:", userId, "role:", userRole);

    let user: any;

    // Look in appropriate collection based on role in token
    if (userRole === "parent") {
      user = await Parent.findById(userId);
    } else {
      user = await User.findById(userId);
    }

    if (!user) throw createError("User not found", 404);

    const profile =
      userRole === "student"
        ? await StudentProfile.findOne({ userId: user._id })
        : null;

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: userRole,
        },
        profile,
      },
    });
  },
);

export const changePassword = asyncHandler(
  async (
    req: Request & { user?: { id: string; role: string } },
    res: Response,
  ) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!currentPassword || !newPassword) {
      throw createError("Current and new passwords are required", 400);
    }

    // Validate new password strength
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      throw createError(passwordValidation.error || "Invalid password", 400);
    }

    // Ensure new password is different from current
    if (currentPassword === newPassword) {
      throw createError(
        "New password must be different from current password",
        400,
      );
    }

    let user: any;

    // Look in appropriate collection based on role in token
    if (userRole === "parent") {
      user = await Parent.findById(userId).select("+password");
    } else {
      user = await User.findById(userId).select("+password");
    }

    if (!user) throw createError("User not found", 404);

    if (!(await user.comparePassword(currentPassword))) {
      throw createError("Current password is incorrect", 401);
    }

    user.password = passwordValidation.value;
    await user.save();

    res.json({ success: true, message: "Password updated successfully" });
  },
);
