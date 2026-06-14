import { cookies } from "next/headers";
import { getUserById } from "@/lib/db/queries";

export type UserType = "guest" | "regular";

export async function auth() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("paycon-session")?.value;

  if (!userId) {
    return null;
  }

  const userObj = await getUserById(userId);
  if (!userObj) {
    return null;
  }

  return {
    user: {
      id: userObj.id,
      email: userObj.email,
      phoneNumber: userObj.phoneNumber,
      walletAddress: userObj.walletAddress,
      type: "regular" as UserType,
    },
  };
}

export async function signIn() {
  return { ok: true } as any;
}

export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete("paycon-session");
  return { ok: true } as any;
}

export const handlers = {
  GET: async () => new Response("Auth active"),
  POST: async () => new Response("Auth active"),
} as any;
export const GET = handlers.GET;
export const POST = handlers.POST;
