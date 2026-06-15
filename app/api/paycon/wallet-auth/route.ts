import { NextResponse, type NextRequest } from "next/server";
import { getOrCreateUserByWalletAddress } from "@/lib/db/queries";

export async function POST(request: NextRequest) {
  try {
    const { walletAddress } = await request.json();

    if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return NextResponse.json(
        { error: "Invalid wallet address" },
        { status: 400 }
      );
    }

    // Get or create user by wallet address in Supabase / DB
    const userObj = await getOrCreateUserByWalletAddress({ walletAddress: walletAddress.toLowerCase() });

    if (!userObj) {
      return NextResponse.json(
        { error: "Failed to authenticate wallet" },
        { status: 500 }
      );
    }

    // Set session cookie
    const response = NextResponse.json({
      ok: true,
      userId: userObj.id,
      walletAddress: userObj.walletAddress,
    });

    response.cookies.set("paycon-session", userObj.id, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      sameSite: "lax",
    });

    return response;
  } catch (error: any) {
    console.error("Wallet auth error:", error);
    return NextResponse.json(
      { error: error?.message || "Authentication failed" },
      { status: 500 }
    );
  }
}
