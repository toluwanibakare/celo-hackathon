import { NextResponse } from "next/server";
import { getUserById, getUserByPhone, getTransactions } from "@/lib/db/queries";
import { getStablecoinBalances } from "@/lib/wallet";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const phone = searchParams.get("phone");

  try {
    let userData = null;
    if (userId) {
      userData = await getUserById(userId);
    } else if (phone) {
      userData = await getUserByPhone(phone);
    }

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get real on-chain balance
    const onChain = await getStablecoinBalances(userData.walletAddress || "");

    return NextResponse.json({
      cUSD: onChain.cUSD,
      usdc: onChain.usdc,
      celo: onChain.celo,
      onChain: {
        cUSD: onChain.cUSD,
        usdc: onChain.usdc,
        celo: onChain.celo,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
