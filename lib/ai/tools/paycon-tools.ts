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
import { getStablecoinBalances, generateCeloWallet, executeStablecoinTransfer } from "@/lib/wallet";
import { sendReceiptEmail } from "@/lib/email";

type Session = any;

interface PayconToolsProps {
  session: Session;
}

export const payconTools = ({ session }: PayconToolsProps) => {
  const userId = session?.user?.id;

  return {
    getWalletDetails: tool({
      description: "Get the user's Celo wallet address and current stablecoin balances (cUSD and USDC) on Celo Sepolia.",
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

        return {
          walletAddress: userData.walletAddress,
          balances: {
            cUSD: onChain.cUSD,
            usdc: onChain.usdc,
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
      description: "Create a new savings goal for the user. This automatically generates a unique on-chain vault address for this goal.",
      inputSchema: z.object({
        title: z.string().describe("The name or title of the savings goal (e.g. 'New Laptop')"),
        targetAmount: z.number().describe("The target savings amount in USD"),
        targetDate: z.string().describe("The target date to achieve the goal in YYYY-MM-DD format"),
      }),
      execute: async ({ title, targetAmount, targetDate }) => {
        if (!userId || userId === "public-user") {
          return { error: "No user authenticated. Please sign in." };
        }

        // Generate Celo wallet for the goal's vault
        const vault = generateCeloWallet();

        const goal = await createSavingsGoal(userId, {
          title,
          targetAmount: String(targetAmount),
          targetDate: new Date(targetDate),
          vaultAddress: vault.address,
          vaultPrivateKey: vault.privateKey,
        });

        if (!goal) {
          return { error: "Failed to create savings goal." };
        }

        return { 
          success: true, 
          message: `Savings goal "${title}" created successfully! A secure Celo Sepolia vault address has been generated for it: ${vault.address}`, 
          goal 
        };
      },
    }),

    contributeToSavings: tool({
      description: "Contribute/save money from the user's wallet towards an active savings goal. This performs a real on-chain transfer to the goal's vault.",
      inputSchema: z.object({
        goalId: z.string().describe("The unique ID of the savings goal"),
        amount: z.number().describe("The amount to contribute in USD/cUSD"),
        token: z.enum(["cUSD", "USDC"]).optional().default("cUSD").describe("The token to use (default cUSD)"),
      }),
      execute: async ({ goalId, amount, token }) => {
        if (!userId || userId === "public-user") {
          return { error: "No user authenticated. Please sign in." };
        }

        const userData = await getUserById(userId);
        if (!userData || !userData.walletPrivateKey) {
          return { error: "User wallet private key not found. Please set up your wallet." };
        }

        const goals = await getSavingsGoals(userId);
        const goal = goals.find((g) => g.id === goalId);
        if (!goal) {
          return { error: "Savings goal not found." };
        }

        // Initialize vault if not present (legacy goals)
        let vaultAddress = goal.vaultAddress;
        if (!vaultAddress) {
          const vault = generateCeloWallet();
          vaultAddress = vault.address;
          await updateSavingsGoal(goalId, {
            vaultAddress: vault.address,
            vaultPrivateKey: vault.privateKey,
          } as any);
        }

        let txHash = "";
        try {
          // Perform real on-chain stablecoin transfer to the goal's vault
          txHash = await executeStablecoinTransfer(
            userData.walletPrivateKey,
            vaultAddress,
            amount,
            token || "cUSD"
          );
        } catch (error: any) {
          console.error("On-chain transfer failed:", error);
          return { 
            error: `Failed to complete on-chain transfer: ${error.message || "Please ensure your wallet has sufficient balance and CELO for gas."}` 
          };
        }

        const newCurrentAmount = (Number(goal.currentAmount) + amount).toFixed(2);
        const updatedGoal = await updateSavingsGoal(goalId, {
          currentAmount: newCurrentAmount,
        });

        if (!updatedGoal) {
          return { error: "Failed to update savings goal in database." };
        }

        // Record the transaction with the on-chain hash
        await createTransaction(userId, {
          type: "savings_contribution",
          amount: String(amount),
          token: token,
          description: `Saved towards "${goal.title}"`,
          status: "completed",
          txHash: txHash,
        });

        // Send transaction receipt email if user has an email address
        if (userData.email) {
          try {
            await sendReceiptEmail(userData.email, {
              type: "savings_contribution",
              amount: String(amount),
              token: token || "cUSD",
              txHash,
              description: `Saved towards "${goal.title}"`,
            });
          } catch (emailErr) {
            console.error("Failed to send receipt email:", emailErr);
          }
        }

        return {
          success: true,
          message: `Successfully contributed $${amount} to "${goal.title}" on-chain!`,
          txHash: txHash,
          goal: updatedGoal,
        };
      },
    }),

    payBill: tool({
      description: "Pay an upcoming bill from the user's wallet. This performs a real on-chain transfer to the merchant.",
      inputSchema: z.object({
        billId: z.string().describe("The unique ID of the bill to pay"),
        token: z.enum(["cUSD", "USDC"]).optional().default("cUSD").describe("The token to use (default cUSD)"),
      }),
      execute: async ({ billId, token }) => {
        if (!userId || userId === "public-user") {
          return { error: "No user authenticated. Please sign in." };
        }

        const userData = await getUserById(userId);
        if (!userData || !userData.walletPrivateKey) {
          return { error: "User wallet private key not found. Please set up your wallet." };
        }

        const bills = await getBills(userId);
        const targetBill = bills.find((b) => b.id === billId);

        if (!targetBill) {
          return { error: "Bill not found." };
        }

        if (targetBill.isPaid) {
          return { error: "This bill has already been paid." };
        }

        const merchantAddress = "0x000000000000000000000000000000000000beef";
        let txHash = "";

        try {
          // Perform real on-chain stablecoin transfer to the merchant
          txHash = await executeStablecoinTransfer(
            userData.walletPrivateKey,
            merchantAddress,
            Number(targetBill.amount),
            token || "cUSD"
          );
        } catch (error: any) {
          console.error("On-chain bill payment failed:", error);
          return { 
            error: `Failed to pay bill on-chain: ${error.message || "Please ensure your wallet has sufficient balance and CELO for gas."}` 
          };
        }

        // Update bill paid status
        const updated = await updateBill(billId, { isPaid: true });

        if (!updated) {
          return { error: "Failed to update bill paid status in database." };
        }

        // Record the transaction with the on-chain hash
        await createTransaction(userId, {
          type: "bill_payment",
          amount: targetBill.amount,
          token: token,
          description: `Paid bill "${targetBill.title}"`,
          status: "completed",
          txHash: txHash,
        });

        // Send transaction receipt email if user has an email address
        if (userData.email) {
          try {
            await sendReceiptEmail(userData.email, {
              type: "bill_payment",
              amount: targetBill.amount,
              token: token || "cUSD",
              txHash,
              description: `Paid bill "${targetBill.title}"`,
            });
          } catch (emailErr) {
            console.error("Failed to send receipt email:", emailErr);
          }
        }

        return {
          success: true,
          message: `Bill "${targetBill.title}" ($${targetBill.amount}) paid successfully on-chain!`,
          txHash: txHash,
          bill: updated,
        };
      },
    }),
  };
};
