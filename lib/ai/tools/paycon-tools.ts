import { tool } from "ai";
import { z } from "zod";
import {
  getSavingsGoals,
  createSavingsGoal,
  updateSavingsGoal,
  getBills,
  updateBill,
  createTransaction,
  getTransactions,
  getUserById,
} from "@/lib/db/queries";
import { getStablecoinBalances } from "@/lib/wallet";

type Session = any;

interface PayconToolsProps {
  session: Session;
}

export const payconTools = ({ session }: PayconToolsProps) => {
  const userId = session?.user?.id;

  return {
    getWalletDetails: tool({
      description: "Get the user's Celo wallet address and current stablecoin balances (cUSD and USDC), including simulated transactions.",
      inputSchema: z.object({}),
      execute: async () => {
        if (!userId || userId === "public-user") {
          return { error: "No user authenticated. Please sign in." };
        }

        const userData = await getUserById(userId);
        if (!userData) {
          return { error: "User not found." };
        }

        // Get on-chain balance
        const onChain = await getStablecoinBalances(userData.walletAddress || "");

        // Get simulated transaction offset
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
              if (tx.token === "cUSD") cUSDOffset -= amt;
              else if (tx.token === "USDC") usdcOffset -= amt;
            }
          }
        }

        const totalCUSD = Math.max(0, onChain.cUSD + cUSDOffset);
        const totalUSDC = Math.max(0, onChain.usdc + usdcOffset);

        return {
          walletAddress: userData.walletAddress,
          balances: {
            cUSD: totalCUSD,
            usdc: totalUSDC,
          },
          onChain: {
            cUSD: onChain.cUSD,
            usdc: onChain.usdc,
          },
          simulatedOffset: {
            cUSD: cUSDOffset,
            usdc: usdcOffset,
          },
        };
      },
    }),

    getSavingsGoals: tool({
      description: "Retrieve a list of the user's active savings goals, including current saved amounts and targets.",
      inputSchema: z.object({}),
      execute: async () => {
        if (!userId || userId === "public-user") {
          return { error: "No user authenticated. Please sign in." };
        }
        const goals = await getSavingsGoals(userId);
        return { goals };
      },
    }),

    getBills: tool({
      description: "Retrieve a list of the user's upcoming, paid, and unpaid bills.",
      inputSchema: z.object({}),
      execute: async () => {
        if (!userId || userId === "public-user") {
          return { error: "No user authenticated. Please sign in." };
        }
        const bills = await getBills(userId);
        return { bills };
      },
    }),

    createSavingsGoal: tool({
      description: "Create a new savings goal for the user.",
      inputSchema: z.object({
        title: z.string().describe("The name or title of the savings goal (e.g. 'New Laptop')"),
        targetAmount: z.number().describe("The target savings amount in USD"),
        targetDate: z.string().describe("The target date to achieve the goal in YYYY-MM-DD format"),
      }),
      execute: async ({ title, targetAmount, targetDate }) => {
        if (!userId || userId === "public-user") {
          return { error: "No user authenticated. Please sign in." };
        }

        const goal = await createSavingsGoal(userId, {
          title,
          targetAmount: String(targetAmount),
          targetDate: new Date(targetDate),
        });

        if (!goal) {
          return { error: "Failed to create savings goal." };
        }

        return { success: true, message: `Savings goal "${title}" created successfully!`, goal };
      },
    }),

    contributeToSavings: tool({
      description: "Contribute/save money from the user's wallet towards an active savings goal.",
      inputSchema: z.object({
        goalId: z.string().describe("The unique ID of the savings goal"),
        amount: z.number().describe("The amount to contribute in USD/cUSD"),
        token: z.enum(["cUSD", "USDC"]).optional().default("cUSD").describe("The token to use (default cUSD)"),
      }),
      execute: async ({ goalId, amount, token }) => {
        if (!userId || userId === "public-user") {
          return { error: "No user authenticated. Please sign in." };
        }

        const goals = await getSavingsGoals(userId);
        const goal = goals.find((g) => g.id === goalId);
        if (!goal) {
          return { error: "Savings goal not found." };
        }

        const newCurrentAmount = (Number(goal.currentAmount) + amount).toFixed(2);
        const updatedGoal = await updateSavingsGoal(goalId, {
          currentAmount: newCurrentAmount,
        });

        if (!updatedGoal) {
          return { error: "Failed to update savings goal." };
        }

        // Record the transaction
        await createTransaction(userId, {
          type: "savings_contribution",
          amount: String(amount),
          token: token,
          description: `Saved towards "${goal.title}"`,
        });

        return {
          success: true,
          message: `Successfully contributed $${amount} to "${goal.title}".`,
          goal: updatedGoal,
        };
      },
    }),

    payBill: tool({
      description: "Pay an upcoming bill from the user's wallet.",
      inputSchema: z.object({
        billId: z.string().describe("The unique ID of the bill to pay"),
        token: z.enum(["cUSD", "USDC"]).optional().default("cUSD").describe("The token to use (default cUSD)"),
      }),
      execute: async ({ billId, token }) => {
        if (!userId || userId === "public-user") {
          return { error: "No user authenticated. Please sign in." };
        }

        const bills = await getBills(userId);
        const targetBill = bills.find((b) => b.id === billId);

        if (!targetBill) {
          return { error: "Bill not found." };
        }

        if (targetBill.isPaid) {
          return { error: "This bill has already been paid." };
        }

        // Update bill paid status
        const updated = await updateBill(billId, { isPaid: true });

        if (!updated) {
          return { error: "Failed to pay bill." };
        }

        // Record the transaction
        await createTransaction(userId, {
          type: "bill_payment",
          amount: targetBill.amount,
          token: token,
          description: `Paid bill "${targetBill.title}"`,
        });

        return {
          success: true,
          message: `Bill "${targetBill.title}" ($${targetBill.amount}) paid successfully.`,
          bill: updated,
        };
      },
    }),
  };
};
