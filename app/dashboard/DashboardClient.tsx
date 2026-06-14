"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import {
  Wallet,
  DollarSign,
  TrendingUp,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
  Coins,
  MessageSquare,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Sparkles,
  LogOut,
  Copy,
  Check,
  Send,
  X,
  CreditCard,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface User {
  id: string;
  email: string | null;
  phoneNumber: string | null;
  walletAddress: string | null;
}

export function DashboardClient({ user }: { user: User }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Dashboard state
  const [balances, setBalances] = useState({ cUSD: 0, usdc: 0 });
  const [goals, setGoals] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  // Modals / forms state
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositToken, setDepositToken] = useState("cUSD");

  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalTitle, setGoalTitle] = useState("");
  const [goalTargetAmount, setGoalTargetAmount] = useState("");
  const [goalTargetDate, setGoalTargetDate] = useState("");

  const [showBillModal, setShowBillModal] = useState(false);
  const [billTitle, setBillTitle] = useState("");
  const [billAmount, setBillAmount] = useState("");
  const [billDueDate, setBillDueDate] = useState("");
  const [billFrequency, setBillFrequency] = useState("monthly");

  const [contributeGoalId, setContributeGoalId] = useState<string | null>(null);
  const [contributeAmount, setContributeAmount] = useState("");

  // Chat interface toggle
  const [isChatOpen, setIsChatOpen] = useState(true);

  // Fetch dashboard data
  const loadData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      // Balance
      const balRes = await fetch(`/api/paycon/balance?userId=${user.id}`);
      const balData = await balRes.json();
      if (balRes.ok) {
        setBalances({ cUSD: balData.cUSD || 0, usdc: balData.usdc || 0 });
      }

      // Savings Goals
      const goalsRes = await fetch(`/api/paycon/savings?userId=${user.id}`);
      const goalsData = await goalsRes.json();
      if (goalsRes.ok) {
        setGoals(goalsData);
      }

      // Bills
      const billsRes = await fetch(`/api/paycon/bills?userId=${user.id}`);
      const billsData = await billsRes.json();
      if (billsRes.ok) {
        setBills(billsData);
      }

      // Transactions
      const txRes = await fetch(`/api/paycon/transactions?userId=${user.id}`);
      const txData = await txRes.json();
      if (txRes.ok) {
        setTransactions(txData);
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      toast.error("Failed to sync dashboard data.");
    } finally {
      setIsLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // AI Chat Setup
  const { messages, input, handleInputChange, handleSubmit, isLoading: isChatLoading, setMessages } = useChat({
    api: "/api/paycon/chat",
    id: `paycon-coach-${user.id}`,
    body: {
      id: `paycon-coach-${user.id}`,
    },
    initialMessages: [
      {
        id: "welcome",
        role: "assistant",
        content: `Hi! I'm your Paycon AI Financial Coach. 🤖💰\n\nI can help you budget, check your balances, auto-pay bills, and manage your savings goals on the Celo network. Try asking me:\n- *"Can I afford to spend $25 today?"*\n- *"Pay my electricity bill"* or *"Set a savings goal of $150"*`,
      },
    ],
    onFinish: () => {
      // Reload dashboard data in case AI triggered tools
      loadData(true);
    },
  });

  const copyAddress = () => {
    if (user.walletAddress) {
      navigator.clipboard.writeText(user.walletAddress);
      setCopied(true);
      toast.success("Wallet address copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Sign out
  const handleSignOut = async () => {
    try {
      const res = await fetch("/api/paycon/user", { method: "DELETE" }); // clearing session
      if (res.ok) {
        toast.success("Logged out successfully");
        router.push("/login");
        router.refresh();
      } else {
        // Fallback signOut
        document.cookie = "paycon-session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
        router.push("/login");
        router.refresh();
      }
    } catch (e) {
      document.cookie = "paycon-session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
      router.push("/login");
      router.refresh();
    }
  };

  // Simulated Deposit Action
  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositAmount || isNaN(Number(depositAmount)) || Number(depositAmount) <= 0) {
      toast.error("Please enter a valid deposit amount");
      return;
    }

    try {
      const res = await fetch("/api/paycon/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          type: "deposit",
          amount: depositAmount,
          token: depositToken,
          description: `Simulated deposit of ${depositAmount} ${depositToken}`,
          status: "completed",
        }),
      });

      if (res.ok) {
        toast.success(`Successfully deposited ${depositAmount} ${depositToken} (Simulated)`);
        setShowDepositModal(false);
        setDepositAmount("");
        loadData(true);
      } else {
        toast.error("Failed to execute deposit");
      }
    } catch (err) {
      toast.error("Deposit failed");
    }
  };

  // Create Savings Goal
  const handleCreateGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle || !goalTargetAmount || !goalTargetDate) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      const res = await fetch("/api/paycon/savings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          title: goalTitle,
          targetAmount: goalTargetAmount,
          targetDate: goalTargetDate,
        }),
      });

      if (res.ok) {
        toast.success(`Created savings goal "${goalTitle}"`);
        setShowGoalModal(false);
        setGoalTitle("");
        setGoalTargetAmount("");
        setGoalTargetDate("");
        loadData(true);
      } else {
        toast.error("Failed to create savings goal");
      }
    } catch (err) {
      toast.error("Failed to save savings goal");
    }
  };

  // Contribute to Goal
  const handleContributeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contributeGoalId || !contributeAmount || isNaN(Number(contributeAmount)) || Number(contributeAmount) <= 0) {
      toast.error("Please enter a valid savings contribution");
      return;
    }

    // Verify balance
    const needed = Number(contributeAmount);
    if (balances.cUSD < needed) {
      toast.error(`Insufficient cUSD balance. You have $${balances.cUSD.toFixed(2)} cUSD`);
      return;
    }

    try {
      const res = await fetch("/api/paycon/savings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          goalId: contributeGoalId,
          amount: contributeAmount,
          token: "cUSD",
        }),
      });

      if (res.ok) {
        toast.success(`Contributed $${contributeAmount} to goal`);
        setContributeGoalId(null);
        setContributeAmount("");
        loadData(true);
      } else {
        toast.error("Failed to contribute to savings");
      }
    } catch (err) {
      toast.error("Savings contribution failed");
    }
  };

  // Create Bill
  const handleCreateBillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!billTitle || !billAmount || !billDueDate) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      const res = await fetch("/api/paycon/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          title: billTitle,
          amount: billAmount,
          dueDate: billDueDate,
          frequency: billFrequency,
        }),
      });

      if (res.ok) {
        toast.success(`Created bill "${billTitle}"`);
        setShowBillModal(false);
        setBillTitle("");
        setBillAmount("");
        setBillDueDate("");
        loadData(true);
      } else {
        toast.error("Failed to create bill");
      }
    } catch (err) {
      toast.error("Failed to save bill");
    }
  };

  // Pay Bill Action
  const handlePayBill = async (billId: string, title: string, amount: string) => {
    const cost = Number(amount);
    if (balances.cUSD < cost) {
      toast.error(`Insufficient cUSD balance to pay this bill ($${cost.toFixed(2)} needed, $${balances.cUSD.toFixed(2)} available).`);
      return;
    }

    const confirmPay = window.confirm(`Are you sure you want to pay "${title}" for $${amount} cUSD?`);
    if (!confirmPay) return;

    try {
      const res = await fetch("/api/paycon/bills", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: billId,
          userId: user.id,
          isPaid: true,
          token: "cUSD",
        }),
      });

      if (res.ok) {
        toast.success(`Paid bill "${title}"!`);
        loadData(true);
      } else {
        toast.error("Failed to process bill payment");
      }
    } catch (err) {
      toast.error("Payment error");
    }
  };

  // Delete Savings Goal
  const handleDeleteGoal = async (id: string, title: string) => {
    if (!window.confirm(`Delete savings goal "${title}"?`)) return;
    try {
      const res = await fetch(`/api/paycon/savings?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success(`Deleted goal "${title}"`);
        loadData(true);
      }
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  // Delete Bill
  const handleDeleteBill = async (id: string, title: string) => {
    if (!window.confirm(`Delete bill "${title}"?`)) return;
    try {
      const res = await fetch(`/api/paycon/bills?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success(`Deleted bill "${title}"`);
        loadData(true);
      }
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* HEADER NAVBAR */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40 px-4 md:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500 text-slate-950 p-2 rounded-xl shadow-lg shadow-emerald-500/20">
            <Coins className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
              Paycon
            </h1>
            <p className="text-xs text-slate-400 hidden sm:block">AI-Powered Stablecoin Manager</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden lg:flex flex-col text-right text-xs">
            <span className="text-slate-300 font-medium">{user.email}</span>
            {user.phoneNumber && <span className="text-slate-400">{user.phoneNumber}</span>}
          </div>
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition ${
              isChatOpen
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            <span className="hidden md:inline">AI Coach</span>
          </button>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-red-950/40 border border-red-900/30 text-red-400 hover:bg-red-900/40 transition"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* DASHBOARD BODY CONTAINER */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* MAIN WIDGETS SECTION */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
          {isLoading && (
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-3">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-emerald-400 border-r-2 border-transparent"></div>
              <p className="text-slate-400 text-sm">Syncing with Celo network...</p>
            </div>
          )}

          {/* TOP CARDS ROW */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* WALLET ADDRESS & NETWORKS */}
            <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full filter blur-3xl pointer-events-none group-hover:bg-emerald-500/10 transition-all duration-700"></div>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-emerald-400" />
                    <span className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Celo Wallet</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Celo Sepolia Testnet
                  </span>
                </div>
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3 flex items-center justify-between gap-4 font-mono text-sm max-w-full overflow-hidden">
                  <span className="truncate text-slate-300 select-all">{user.walletAddress || "0x..."}</span>
                  <button
                    onClick={copyAddress}
                    className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition shrink-0"
                    title="Copy Address"
                  >
                    {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-800/60">
                <div>
                  <span className="text-xs text-slate-400">cUSD Balance</span>
                  <p className="text-2xl md:text-3xl font-extrabold text-slate-100 mt-1">
                    ${balances.cUSD.toFixed(2)}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">USDC Balance</span>
                  <p className="text-2xl md:text-3xl font-extrabold text-slate-100 mt-1">
                    ${balances.usdc.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={() => setShowDepositModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-sm transition shadow-lg shadow-emerald-500/20"
                >
                  <ArrowUpRight className="h-4 w-4" /> Simulate Deposit
                </button>
                <a
                  href={`https://explorer.celo.org/sepolia/address/${user.walletAddress}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm transition border border-slate-700/50"
                >
                  Block Explorer
                </a>
              </div>
            </div>

            {/* QUICK HEALTH CARD */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between shadow-xl">
              <div>
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Financial Status</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">Total Liquid Savings:</span>
                    <span className="font-bold text-slate-200">${balances.cUSD.toFixed(2)} cUSD</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">Active Goals Goal Value:</span>
                    <span className="font-bold text-slate-200">
                      ${goals.reduce((acc, g) => acc + Number(g.targetAmount), 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">Unpaid Bills Count:</span>
                    <span className="font-bold text-slate-200">
                      {bills.filter((b) => !b.isPaid).length} unpaid (${bills.filter((b) => !b.isPaid).reduce((acc, b) => acc + Number(b.amount), 0).toFixed(2)})
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-3 bg-slate-950/50 border border-slate-800/80 rounded-xl flex items-start gap-2 text-xs text-slate-400">
                <AlertCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Tip:</strong> Keep a buffer of at least $20 cUSD to cover your upcoming bills automatic payments.
                </span>
              </div>
            </div>
          </div>

          {/* GRID OF GOALS AND BILLS */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* SAVINGS GOALS */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-400" />
                  <h2 className="text-lg font-bold text-slate-100">Savings Goals</h2>
                </div>
                <button
                  onClick={() => setShowGoalModal(true)}
                  className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition font-semibold"
                >
                  <Plus className="h-3.5 w-3.5" /> Create Goal
                </button>
              </div>

              {goals.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl">
                  <p className="text-slate-500 text-sm">No savings goals yet.</p>
                  <p className="text-xs text-slate-600 mt-1">Create one to start budgeting and saving automatically.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                  {goals.map((goal) => {
                    const current = Number(goal.currentAmount);
                    const target = Number(goal.targetAmount);
                    const progress = Math.min(100, Math.round((current / target) * 100)) || 0;
                    const isCompleted = current >= target;

                    return (
                      <div
                        key={goal.id}
                        className="bg-slate-950/40 border border-slate-800/80 p-4 rounded-xl flex flex-col gap-3 relative group"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-slate-200">{goal.title}</h4>
                            <span className="text-xs text-slate-400">
                              Target Date: {new Date(goal.targetDate).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              isCompleted ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25" : "bg-slate-800 text-slate-400"
                            }`}>
                              {progress}%
                            </span>
                            <button
                              onClick={() => handleDeleteGoal(goal.id, goal.title)}
                              className="p-1 hover:bg-slate-800 text-slate-500 hover:text-red-400 rounded-md transition"
                              title="Delete Goal"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                          <div
                            className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>

                        <div className="flex justify-between items-center text-xs text-slate-400">
                          <span>
                            Saved: <strong>${current.toFixed(2)}</strong> / ${target.toFixed(2)} cUSD
                          </span>
                          {!isCompleted && (
                            <button
                              onClick={() => setContributeGoalId(goal.id)}
                              className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 hover:underline"
                            >
                              <Plus className="h-3 w-3" /> Save Funds
                            </button>
                          )}
                        </div>

                        {/* Contribute mini form */}
                        <AnimatePresence>
                          {contributeGoalId === goal.id && (
                            <motion.form
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              onSubmit={handleContributeSubmit}
                              className="mt-2 pt-2 border-t border-slate-800 flex items-center gap-2 overflow-hidden"
                            >
                              <input
                                type="number"
                                placeholder="Amount in cUSD"
                                value={contributeAmount}
                                onChange={(e) => setContributeAmount(e.target.value)}
                                className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-emerald-500 text-slate-100 flex-1"
                                required
                              />
                              <button
                                type="submit"
                                className="bg-emerald-500 text-slate-950 font-bold px-3 py-1 rounded-lg text-xs hover:bg-emerald-600 transition"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setContributeGoalId(null);
                                  setContributeAmount("");
                                }}
                                className="text-slate-400 hover:text-slate-200"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </motion.form>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* BILL PLANNER */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-emerald-400" />
                  <h2 className="text-lg font-bold text-slate-100">Bill Planner</h2>
                </div>
                <button
                  onClick={() => setShowBillModal(true)}
                  className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition font-semibold"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Bill
                </button>
              </div>

              {bills.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl">
                  <p className="text-slate-500 text-sm">No bills added yet.</p>
                  <p className="text-xs text-slate-600 mt-1">Add regular bills here to enable tracking and pay them instantly.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                  {bills.map((bill) => {
                    const isPaid = bill.isPaid;
                    const dueDateStr = new Date(bill.dueDate).toLocaleDateString();

                    return (
                      <div
                        key={bill.id}
                        className="bg-slate-950/40 border border-slate-800/80 p-4 rounded-xl flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl border ${
                            isPaid ? "bg-emerald-950/20 border-emerald-800/30 text-emerald-400" : "bg-slate-900 border-slate-800 text-slate-400"
                          }`}>
                            <CreditCard className="h-4 w-4" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-200">{bill.title}</h4>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                              <span>Due: {dueDateStr}</span>
                              <span>•</span>
                              <span className="capitalize">{bill.frequency}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="font-bold text-slate-200 block">${Number(bill.amount).toFixed(2)} cUSD</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {isPaid ? (
                              <span className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <CheckCircle2 className="h-3 w-3" /> Paid
                              </span>
                            ) : (
                              <button
                                onClick={() => handlePayBill(bill.id, bill.title, bill.amount)}
                                className="px-2.5 py-1 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-lg transition"
                              >
                                Pay
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteBill(bill.id, bill.title)}
                              className="p-1 hover:bg-slate-800 text-slate-500 hover:text-red-400 rounded-md transition"
                              title="Delete Bill"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RECENT TRANSACTIONS */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-lg font-bold text-slate-100 mb-6 flex items-center gap-2">
              <Clock className="h-5 w-5 text-emerald-400" /> Recent Transactions
            </h2>

            {transactions.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl">
                <p className="text-slate-500 text-sm">No transaction records found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="pb-3 font-semibold">Activity</th>
                      <th className="pb-3 font-semibold hidden md:table-cell">Type</th>
                      <th className="pb-3 font-semibold">Token</th>
                      <th className="pb-3 font-semibold text-right">Amount</th>
                      <th className="pb-3 font-semibold text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {transactions.slice(0, 10).map((tx) => {
                      const isIncoming = tx.type === "deposit";
                      const amountStr = Number(tx.amount).toFixed(2);
                      const isSimulated = !tx.txHash;

                      return (
                        <tr key={tx.id} className="hover:bg-slate-800/10 transition">
                          <td className="py-3 flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${
                              isIncoming ? "bg-emerald-950/20 text-emerald-400" : "bg-blue-950/20 text-blue-400"
                            }`}>
                              {isIncoming ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                            </div>
                            <div>
                              <span className="font-semibold text-slate-200 block">
                                {tx.description || (isIncoming ? "Fund Deposit" : "Outbound Payment")}
                              </span>
                              <span className="text-xs text-slate-400 block mt-0.5">
                                {new Date(tx.createdAt).toLocaleString()}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 capitalize hidden md:table-cell text-slate-300">
                            {tx.type.replace("_", " ")}
                          </td>
                          <td className="py-3 text-slate-300">
                            {tx.token}
                          </td>
                          <td className={`py-3 text-right font-bold ${
                            isIncoming ? "text-emerald-400" : "text-slate-300"
                          }`}>
                            {isIncoming ? "+" : "-"}${amountStr}
                          </td>
                          <td className="py-3 text-right">
                            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                              tx.status === "completed"
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-yellow-500/10 text-yellow-400"
                            }`}>
                              {tx.status} {isSimulated && <span className="text-[10px] text-slate-400 opacity-80">(Sim)</span>}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* AI FINANCIAL COACH CHAT PANEL */}
        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 100 }}
              className="w-full lg:w-96 border-l border-slate-800 bg-slate-900/95 backdrop-blur-md flex flex-col h-[calc(100vh-73px)] shrink-0 absolute right-0 lg:relative z-30"
            >
              <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
                <div className="flex items-center gap-2">
                  <div className="bg-emerald-500/10 p-1.5 rounded-lg border border-emerald-500/20 text-emerald-400">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-200">AI Financial Coach</h3>
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-pulse"></span> Active
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-md transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* MESSAGES VIEW */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-sm">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 whitespace-pre-wrap ${
                        m.role === "user"
                          ? "bg-emerald-500 text-slate-950 font-medium"
                          : "bg-slate-800 border border-slate-800 text-slate-200"
                      }`}
                    >
                      {m.content}
                    </div>
                    <span className="text-[9px] text-slate-500 mt-1 px-1">
                      {m.role === "user" ? "You" : "Coach"}
                    </span>
                  </div>
                ))}

                {isChatLoading && (
                  <div className="flex flex-col items-start">
                    <div className="bg-slate-800 border border-slate-800 text-slate-300 rounded-2xl px-4 py-2.5 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-bounce"></span>
                      <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                      <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                    </div>
                  </div>
                )}
              </div>

              {/* CHAT INPUT FORM */}
              <form onSubmit={handleSubmit} className="p-4 border-t border-slate-800 bg-slate-950/60 flex gap-2">
                <input
                  type="text"
                  placeholder="Ask Coach about your budget..."
                  value={input}
                  onChange={handleInputChange}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-emerald-500 text-slate-100 flex-1"
                  required
                />
                <button
                  type="submit"
                  disabled={isChatLoading || !input.trim()}
                  className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold p-2.5 rounded-xl transition flex items-center justify-center shrink-0"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ======================================================== */}
      {/* MODALS */}
      {/* ======================================================== */}

      {/* DEPOSIT MODAL */}
      <AnimatePresence>
        {showDepositModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
                <h3 className="font-bold text-slate-100 flex items-center gap-2">
                  <ArrowDownLeft className="h-5 w-5 text-emerald-400" /> Simulate Deposit
                </h3>
                <button onClick={() => setShowDepositModal(false)} className="text-slate-400 hover:text-slate-200">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleDepositSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Token type
                  </label>
                  <select
                    value={depositToken}
                    onChange={(e) => setDepositToken(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="cUSD">cUSD (Celo Dollar)</option>
                    <option value="USDC">USDC (USD Coin)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Deposit Amount
                  </label>
                  <input
                    type="number"
                    placeholder="Enter amount (e.g. 50)"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2.5 rounded-xl transition text-sm shadow-lg shadow-emerald-500/20"
                  >
                    Simulate Deposit
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE SAVINGS GOAL MODAL */}
      <AnimatePresence>
        {showGoalModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
                <h3 className="font-bold text-slate-100 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-400" /> Create Savings Goal
                </h3>
                <button onClick={() => setShowGoalModal(false)} className="text-slate-400 hover:text-slate-200">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateGoalSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Goal Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rainy Day Fund, Holiday Trip"
                    value={goalTitle}
                    onChange={(e) => setGoalTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Target Amount (cUSD)
                  </label>
                  <input
                    type="number"
                    placeholder="Target in stablecoins"
                    value={goalTargetAmount}
                    onChange={(e) => setGoalTargetAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Target Date
                  </label>
                  <input
                    type="date"
                    value={goalTargetDate}
                    onChange={(e) => setGoalTargetDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2.5 rounded-xl transition text-sm shadow-lg shadow-emerald-500/20"
                  >
                    Create Savings Goal
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE BILL MODAL */}
      <AnimatePresence>
        {showBillModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
                <h3 className="font-bold text-slate-100 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-emerald-400" /> Add Upcoming Bill
                </h3>
                <button onClick={() => setShowBillModal(false)} className="text-slate-400 hover:text-slate-200">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateBillSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Bill Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Netflix, Electricity, Rent"
                    value={billTitle}
                    onChange={(e) => setBillTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Bill Amount (cUSD)
                  </label>
                  <input
                    type="number"
                    placeholder="Amount to pay"
                    value={billAmount}
                    onChange={(e) => setBillAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={billDueDate}
                    onChange={(e) => setBillDueDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Frequency
                  </label>
                  <select
                    value={billFrequency}
                    onChange={(e) => setBillFrequency(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="weekly">Weekly</option>
                    <option value="yearly">Yearly</option>
                    <option value="one-time">One-time</option>
                  </select>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2.5 rounded-xl transition text-sm shadow-lg shadow-emerald-500/20"
                  >
                    Add Bill to Planner
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
