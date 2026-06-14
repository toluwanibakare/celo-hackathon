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

    // Get simulated transactions to calculate simulated offset
    const txs = await getTransactions(userData.id);
    let cUSDOffset = 0;
    let usdcOffset = 0;

    for (const tx of txs) {
      const amt = Number(tx.amount);
      if (tx.status === "completed" && !tx.txHash) {
        if (tx.type === "deposit") {
          if (tx.token === "cUSD") cUSDOffset += amt;
          else if (tx.token === "USDC") usdcOffset += amt;
        } else {
          // withdrawal, bill_payment, savings_contribution
          if (tx.token === "cUSD") cUSDOffset -= amt;
          else if (tx.token === "USDC") usdcOffset -= amt;
        }
      }
    }

    const totalCUSD = Math.max(0, onChain.cUSD + cUSDOffset);
    const totalUSDC = Math.max(0, onChain.usdc + usdcOffset);

    return NextResponse.json({
      cUSD: totalCUSD,
      usdc: totalUSDC,
      onChain: {
        cUSD: onChain.cUSD,
        usdc: onChain.usdc,
      },
      simulatedOffset: {
        cUSD: cUSDOffset,
        usdc: usdcOffset,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
