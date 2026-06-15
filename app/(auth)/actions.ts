"use server";

import { z } from "zod";
import { cookies } from "next/headers";
import { compareSync } from "bcrypt-ts";
import { createUser, getUser, getUserByPhone, verifyOTP, updateUserPassword } from "@/lib/db/queries";
import { generateHashedPassword } from "@/lib/db/utils";
import { generateCeloWallet } from "@/lib/wallet";
import { ChatSDKError } from "@/lib/errors";

const authFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  phoneNumber: z.string().min(8).optional(),
});

export interface LoginActionState {
  status: "idle" | "in_progress" | "success" | "failed" | "invalid_data";
  error?: string;
}

export const login = async (
  _: LoginActionState,
  formData: FormData
): Promise<LoginActionState> => {
  try {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const validatedData = authFormSchema.parse({
      email,
      password,
    });

    const [userObj] = await getUser(validatedData.email);
    if (!userObj) {
      return { status: "failed" };
    }

    // Verify password using bcrypt
    const isPasswordValid = compareSync(validatedData.password, userObj.password || "");
    if (!isPasswordValid) {
      return { status: "failed" };
    }

    // Set cookie session
    const cookieStore = await cookies();
    cookieStore.set("paycon-session", userObj.id, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    return { status: "success" };
  } catch (error: any) {
    console.error("Login failed:", error);
    if (error instanceof z.ZodError) {
      return { status: "invalid_data", error: error.message };
    }
    const errMsg = error instanceof ChatSDKError ? (error.cause || error.message) : (error?.message || String(error));
    return { status: "failed", error: errMsg };
  }
};

export interface RegisterActionState {
  status:
    | "idle"
    | "in_progress"
    | "success"
    | "failed"
    | "user_exists"
    | "phone_exists"
    | "invalid_data";
  error?: string;
}

export const register = async (
  _: RegisterActionState,
  formData: FormData
): Promise<RegisterActionState> => {
  try {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const rawPhoneNumber = formData.get("phoneNumber") as string;
    const phoneNumber = rawPhoneNumber && rawPhoneNumber.trim() !== "" ? rawPhoneNumber.trim() : undefined;

    const validatedData = authFormSchema.parse({
      email,
      password,
      phoneNumber,
    });

    // Check if user email exists
    const [existingEmail] = await getUser(validatedData.email);
    if (existingEmail) {
      return { status: "user_exists" };
    }

    // Check if phone number exists
    if (phoneNumber) {
      const existingPhone = await getUserByPhone(phoneNumber);
      if (existingPhone) {
        return { status: "phone_exists" };
      }
    }

    // Generate a new Celo wallet for the user
    const wallet = generateCeloWallet();

    // Hash the password
    const hashedPassword = generateHashedPassword(validatedData.password);

    // Create user in database
    const [createdUser] = await createUser(
      validatedData.email,
      hashedPassword,
      phoneNumber,
      wallet.address,
      wallet.privateKey
    );

    if (!createdUser) {
      return { status: "failed" };
    }

    // Set cookie session
    const cookieStore = await cookies();
    cookieStore.set("paycon-session", createdUser.id, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    return { status: "success" };
  } catch (error: any) {
    console.error("Registration failed:", error);
    if (error instanceof z.ZodError) {
      return { status: "invalid_data", error: error.message };
    }
    const errMsg = error instanceof ChatSDKError ? (error.cause || error.message) : (error?.message || String(error));
    return { status: "failed", error: errMsg };
  }
};

export const logout = async () => {
  const cookieStore = await cookies();
  cookieStore.delete("paycon-session");
};

export interface ResetPasswordActionState {
  status: "idle" | "in_progress" | "success" | "failed" | "invalid_data";
  error?: string;
}

const resetPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  otp: z.string().length(4, "Verification code must be exactly 4 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const resetPassword = async (
  _: ResetPasswordActionState,
  formData: FormData
): Promise<ResetPasswordActionState> => {
  try {
    const email = formData.get("email") as string;
    const otp = formData.get("otp") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (!email || !otp || !password || !confirmPassword) {
      return { status: "invalid_data", error: "All fields are required." };
    }

    if (password !== confirmPassword) {
      return { status: "invalid_data", error: "Passwords do not match." };
    }

    const validatedData = resetPasswordSchema.parse({
      email,
      otp,
      password,
    });

    // Check if user exists
    const [userObj] = await getUser(validatedData.email);
    if (!userObj) {
      return { status: "failed", error: "No account found with this email address." };
    }

    // Verify OTP code
    const isOtpValid = await verifyOTP(validatedData.email, validatedData.otp, "reset_password");
    if (!isOtpValid) {
      return { status: "failed", error: "Invalid or expired verification code." };
    }

    // Hash the new password
    const hashedPassword = generateHashedPassword(validatedData.password);

    // Update the password in the database
    const updated = await updateUserPassword(validatedData.email, hashedPassword);
    if (!updated) {
      return { status: "failed", error: "Failed to update the password." };
    }

    return { status: "success" };
  } catch (error: any) {
    console.error("Password reset failed:", error);
    if (error instanceof z.ZodError) {
      const fieldErrors = error.errors.map((err) => err.message).join(". ");
      return { status: "invalid_data", error: fieldErrors };
    }
    const errMsg = error instanceof ChatSDKError ? (error.cause || error.message) : (error?.message || String(error));
    return { status: "failed", error: errMsg };
  }
};
