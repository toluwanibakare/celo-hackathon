import { NextResponse } from "next/server";
import { getUserById, getUserByPhone, updateUserBalance, getTransactions } from "@/lib/db/queries";
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
 
    // Fetch all transaction records to compute adjustments for simulated deposits/withdrawals/payments
    const txs = await getTransactions(userData.id);
    let celoAdjustment = 0;
    for (const tx of txs) {
      // Skip actual on-chain transactions to avoid double-counting
      if (tx.id && tx.id.startsWith("onchain-")) {
        continue;
      }
      if (tx.txHash) {
        continue;
      }
      
      const amt = Number(tx.amount);
      if (Number.isNaN(amt)) continue;

      if (tx.type === "deposit") {
        celoAdjustment += amt;
      } else if (
        tx.type === "withdrawal" || 
        tx.type === "bill_payment" || 
        tx.type === "savings_contribution" || 
        tx.type === "transfer"
      ) {
        celoAdjustment -= amt;
      }
    }

    // Adjust CELO balance, ensuring it does not drop below zero
    const finalCELO = Math.max(0, onChain.celo + celoAdjustment);

    // Persist the balance snapshot to the DB
    updateUserBalance(userData.id, {
      cUSD: 0,
      usdc: 0,
      celo: finalCELO,
    }).catch((e) => console.warn("Balance snapshot save failed:", e));

    return NextResponse.json({
      cUSD: 0,
      usdc: 0,
      celo: finalCELO,
      totalStablecoin: 0,
      onChain: {
        cUSD: 0,
        usdc: 0,
        celo: onChain.celo,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
