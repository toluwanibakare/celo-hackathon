import { NextResponse } from "next/server";
import { getTransactions, createTransaction, getUserByPhone, getUserById, upsertOnChainTransaction } from "@/lib/db/queries";

// GET /api/paycon/transactions
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const phone = searchParams.get("phone");

  try {
    let targetUserId = userId;
    let userData = null;

    if (phone) {
      userData = await getUserByPhone(phone);
      if (!userData) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      targetUserId = userData.id;
    } else if (userId) {
      userData = await getUserById(userId);
    }

    if (!targetUserId || !userData) {
      return NextResponse.json({ error: "Missing userId or phone" }, { status: 400 });
    }

    // Fetch local DB transactions
    const dbTxs = await getTransactions(targetUserId);

    // Fetch on-chain token transfers from Blockscout
    const walletAddress = userData.walletAddress;
    const onChainTxs: any[] = [];

    if (walletAddress && walletAddress.startsWith("0x")) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

        // Fetch ERC-20 token transfers (cUSD / USDC)
        const blockscoutUrl = `https://celo-sepolia.blockscout.com/api?module=account&action=tokentx&address=${walletAddress}&page=1&offset=50&sort=desc`;
        const response = await fetch(blockscoutUrl, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          if (data.status === "1" && Array.isArray(data.result)) {
            const resultList = data.result as any[];
            for (const item of resultList) {
              const hash = item.hash;
              const from = item.from || "";
              const to = item.to || "";
              const value = item.value || "0";
              const tokenSymbol = item.tokenSymbol || "cUSD";
              const decimals = Number(item.tokenDecimal || "18");
              const timeStamp = Number(item.timeStamp || "0");
              const contractAddress = (item.contractAddress || "").toLowerCase();

              // Filter for cUSD (USDm) or USDC on Celo Sepolia
              const isCUSD = contractAddress === "0xef4d55d6de8e8d73232827cd1e9b2f2dbb45bc80";
              const isUSDC = contractAddress === "0x01c5c0122039549ad1493b8220cabedd739bc44e";

              if (isCUSD || isUSDC) {
                const amount = Number(value) / Math.pow(10, decimals);
                const isIncoming = to.toLowerCase() === walletAddress.toLowerCase();

                onChainTxs.push({
                  id: `onchain-${hash}`,
                  type: isIncoming ? "deposit" : "withdrawal",
                  amount: String(amount),
                  token: isCUSD ? "cUSD" : "USDC",
                  status: "completed",
                  txHash: hash,
                  description: isIncoming ? "Received from Faucet/External" : "Sent External",
                  createdAt: new Date(timeStamp * 1000).toISOString(),
                });
              }
            }
          }
        }

        // Also fetch native CELO transfers
        const controller2 = new AbortController();
        const timeoutId2 = setTimeout(() => controller2.abort(), 8000);
        const nativeTxUrl = `https://celo-sepolia.blockscout.com/api?module=account&action=txlist&address=${walletAddress}&page=1&offset=50&sort=desc`;
        const nativeRes = await fetch(nativeTxUrl, { signal: controller2.signal });
        clearTimeout(timeoutId2);

        if (nativeRes.ok) {
          const nativeData = await nativeRes.json();
          if (nativeData.status === "1" && Array.isArray(nativeData.result)) {
            for (const item of nativeData.result as any[]) {
              const hash = item.hash;
              const from = (item.from || "").toLowerCase();
              const to = (item.to || "").toLowerCase();
              const value = item.value || "0";
              const timeStamp = Number(item.timeStamp || "0");
              const amountCelo = Number(value) / 1e18;
              if (amountCelo === 0) continue; // skip zero-value txs
              const isIncoming = to === walletAddress.toLowerCase();
              onChainTxs.push({
                id: `onchain-native-${hash}`,
                type: isIncoming ? "deposit" : "withdrawal",
                amount: String(amountCelo),
                token: "CELO",
                status: "completed",
                txHash: hash,
                description: isIncoming ? "Received CELO" : "Sent CELO",
                createdAt: new Date(timeStamp * 1000).toISOString(),
              });
            }
          }
        }
      } catch (err) {
        console.warn("Blockscout fetch timed out or failed, using local DB fallback:", err);
      }
    }

    // ✅ Persist any new on-chain txs to the DB (fire-and-forget, deduped by txHash)
    if (onChainTxs.length > 0) {
      Promise.all(
        onChainTxs.map((tx) =>
          upsertOnChainTransaction(targetUserId!, {
            txHash: tx.txHash,
            type: tx.type,
            amount: tx.amount,
            token: tx.token,
            status: tx.status,
            description: tx.description,
            createdAt: tx.createdAt,
          })
        )
      ).catch((e) => console.warn("upsertOnChainTransaction batch failed:", e));
    }

    // using txHash to identify matching transactions.
    const mergedMap = new Map<string, any>();

    // 1. Put all on-chain transactions in the map
    for (const tx of onChainTxs) {
      if (tx.txHash) {
        mergedMap.set(tx.txHash.toLowerCase(), tx);
      }
    }

    // 2. Overwrite/add with local DB transactions
    for (const tx of dbTxs) {
      // Normalize createdAt to ISO string
      const txObj = {
        ...tx,
        createdAt: tx.createdAt instanceof Date ? tx.createdAt.toISOString() : tx.createdAt,
      };

      if (tx.txHash) {
        mergedMap.set(tx.txHash.toLowerCase(), txObj);
      } else {
        // If there's no txHash (local only), add it with its ID
        mergedMap.set(tx.id, txObj);
      }
    }

    // Convert back to list and sort by date descending
    const mergedList = Array.from(mergedMap.values()).sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return NextResponse.json(mergedList);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/paycon/transactions
export async function POST(request: Request) {
  try {
    const { userId, phone, type, amount, token, status, txHash, description } = await request.json();

    let targetUserId = userId;
    if (phone) {
      const u = await getUserByPhone(phone);
      if (!u) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      targetUserId = u.id;
    }

    if (!targetUserId || !type || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const tx = await createTransaction(targetUserId, {
      type,
      amount: String(amount),
      token,
      status,
      txHash,
      description,
    });

    return NextResponse.json(tx);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
