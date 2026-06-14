import { NextResponse } from "next/server";
import {
  getSavingsGoals,
  createSavingsGoal,
  updateSavingsGoal,
  deleteSavingsGoal,
  createTransaction,
  getUserByPhone,
} from "@/lib/db/queries";

// GET /api/paycon/savings
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

    const goals = await getSavingsGoals(targetUserId);
    return NextResponse.json(goals);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/paycon/savings (Create a new goal)
export async function POST(request: Request) {
  try {
    const { userId, phone, title, targetAmount, targetDate } = await request.json();

    let targetUserId = userId;
    if (phone) {
      const u = await getUserByPhone(phone);
      if (!u) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      targetUserId = u.id;
    }

    if (!targetUserId || !title || !targetAmount || !targetDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const goal = await createSavingsGoal(targetUserId, {
      title,
      targetAmount: String(targetAmount),
      targetDate: new Date(targetDate),
    });

    return NextResponse.json(goal);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/paycon/savings (Contribute funds to a goal)
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { goalId, amount, token, userId } = body;

    if (!goalId || !amount || !userId) {
      return NextResponse.json({ error: "Missing goalId, userId, or amount" }, { status: 400 });
    }

    const cleanAmount = Number(amount);
    if (isNaN(cleanAmount) || cleanAmount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const finalToken = token || "cUSD";

    const goals = await getSavingsGoals(userId);
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) {
      return NextResponse.json({ error: "Savings goal not found" }, { status: 404 });
    }

    const newCurrentAmount = (Number(goal.currentAmount) + cleanAmount).toFixed(2);
    const updatedGoal = await updateSavingsGoal(goalId, {
      currentAmount: newCurrentAmount,
    });

    // Record the transaction
    await createTransaction(userId, {
      type: "savings_contribution",
      amount: String(cleanAmount),
      token: finalToken,
      description: `Saved towards "${goal.title}"`,
    });

    return NextResponse.json(updatedGoal);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/paycon/savings
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
  }

  try {
    const result = await deleteSavingsGoal(id);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
