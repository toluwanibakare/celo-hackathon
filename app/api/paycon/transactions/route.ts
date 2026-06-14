import { NextResponse } from "next/server";
import { getTransactions, createTransaction, getUserByPhone } from "@/lib/db/queries";

// GET /api/paycon/transactions
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const phone = searchParams.get("phone");

  try {
    let targetUserId = userId;
    if (phone) {
      const u = await getUserByPhone(phone);
      if (!u) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      targetUserId = u.id;
    }

    if (!targetUserId) {
      return NextResponse.json({ error: "Missing userId or phone" }, { status: 400 });
    }

    const txs = await getTransactions(targetUserId);
    return NextResponse.json(txs);
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
