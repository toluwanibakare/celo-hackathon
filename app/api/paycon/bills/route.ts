import { NextResponse } from "next/server";
import {
  getBills,
  createBill,
  updateBill,
  deleteBill,
  createTransaction,
  getUserByPhone,
} from "@/lib/db/queries";

// GET /api/paycon/bills
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

    const bills = await getBills(targetUserId);
    return NextResponse.json(bills);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/paycon/bills
export async function POST(request: Request) {
  try {
    const { userId, phone, title, amount, dueDate, frequency } = await request.json();

    let targetUserId = userId;
    if (phone) {
      const u = await getUserByPhone(phone);
      if (!u) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      targetUserId = u.id;
    }

    if (!targetUserId || !title || !amount || !dueDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newBill = await createBill(targetUserId, {
      title,
      amount: String(amount),
      dueDate: new Date(dueDate),
      frequency,
    });

    return NextResponse.json(newBill);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/paycon/bills (Pay a bill)
export async function PATCH(request: Request) {
  try {
    const { id, userId, isPaid, token } = await request.json();

    if (!id || !userId) {
      return NextResponse.json({ error: "Missing id or userId" }, { status: 400 });
    }

    // Get all user bills to find this one and get its details
    const bills = await getBills(userId);
    const targetBill = bills.find((b) => b.id === id);

    if (!targetBill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    // Update bill paid status
    const updated = await updateBill(id, { isPaid: isPaid ?? true });

    // If marked as paid, record the transaction
    if (isPaid ?? true) {
      await createTransaction(userId, {
        type: "bill_payment",
        amount: targetBill.amount,
        token: token || "cUSD",
        description: `Paid bill "${targetBill.title}"`,
      });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/paycon/bills
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
  }

  try {
    const result = await deleteBill(id);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
