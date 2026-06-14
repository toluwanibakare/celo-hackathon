"use server";

import { z } from "zod";
import { cookies } from "next/headers";
import { compareSync } from "bcrypt-ts";
import { createUser, getUser, getUserByPhone } from "@/lib/db/queries";
import { generateHashedPassword } from "@/lib/db/utils";
import { generateCeloWallet } from "@/lib/wallet";

const authFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  phoneNumber: z.string().min(8).optional(),
});

export interface LoginActionState {
  status: "idle" | "in_progress" | "success" | "failed" | "invalid_data";
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
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: "invalid_data" };
    }
    return { status: "failed" };
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
}

export const register = async (
  _: RegisterActionState,
  formData: FormData
): Promise<RegisterActionState> => {
  try {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const phoneNumber = formData.get("phoneNumber") as string;

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
  } catch (error) {
    console.error("Registration failed:", error);
    if (error instanceof z.ZodError) {
      return { status: "invalid_data" };
    }
    return { status: "failed" };
  }
};

export const logout = async () => {
  const cookieStore = await cookies();
  cookieStore.delete("paycon-session");
};
