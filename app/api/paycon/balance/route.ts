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
 
    // Fetch all transaction records to compute adjustments for simulated swap deposits and withdrawals
    const txs = await getTransactions(userData.id);
    const swapAdjustments = { cUSD: 0, usdc: 0, celo: 0 };
    for (const tx of txs) {
      const descLower = tx.description?.toLowerCase() || "";
      const isSwap = descLower.includes("swap");
      const isDeposit = tx.type === "deposit" && descLower.includes("received");
      const isWithdrawal = tx.type === "withdrawal" && descLower.includes("sold");

      if (isSwap && (isDeposit || isWithdrawal)) {
        const tokenUpper = tx.token.toUpperCase();
        const amt = Number(tx.amount);
        const direction = isDeposit ? 1 : -1;
        
        if (tokenUpper === "CUSD" || tokenUpper === "USDM") {
          swapAdjustments.cUSD += amt * direction;
        } else if (tokenUpper === "USDC") {
          swapAdjustments.usdc += amt * direction;
        } else if (tokenUpper === "CELO") {
          swapAdjustments.celo += amt * direction;
        }
      }
    }

    // Adjust balances, ensuring they do not drop below zero
    const finalCUSD = Math.max(0, onChain.cUSD + swapAdjustments.cUSD);
    const finalUSDC = Math.max(0, onChain.usdc + swapAdjustments.usdc);
    const finalCELO = Math.max(0, onChain.celo + swapAdjustments.celo);

    // ✅ Persist the balance snapshot to the DB (fire-and-forget, non-blocking)
    updateUserBalance(userData.id, {
      cUSD: finalCUSD,
      usdc: finalUSDC,
      celo: finalCELO,
    }).catch((e) => console.warn("Balance snapshot save failed:", e));

    return NextResponse.json({
      cUSD: finalCUSD,
      usdc: finalUSDC,
      celo: finalCELO,
      // Total capital = stablecoins only (not CELO, which is volatile gas token)
      totalStablecoin: finalCUSD + finalUSDC,
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
