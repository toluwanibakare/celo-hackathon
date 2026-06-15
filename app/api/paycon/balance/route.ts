import { NextResponse } from "next/server";
import { getUserById, getUserByPhone, updateUserBalance } from "@/lib/db/queries";
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

    // Fetch live on-chain balances from Celo Sepolia
    const onChain = await getStablecoinBalances(userData.walletAddress || "");

    // ✅ Persist the balance snapshot to the DB (fire-and-forget, non-blocking)
    updateUserBalance(userData.id, {
      cUSD: onChain.cUSD,
      usdc: onChain.usdc,
      celo: onChain.celo,
    }).catch((e) => console.warn("Balance snapshot save failed:", e));

    return NextResponse.json({
      cUSD: onChain.cUSD,
      usdc: onChain.usdc,
      celo: onChain.celo,
      // Total capital = stablecoins only (not CELO, which is volatile gas token)
      totalStablecoin: onChain.cUSD + onChain.usdc,
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
