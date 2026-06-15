"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Wallet,
  TrendingUp,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
  Coins,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  LogOut,
  Copy,
  Check,
  X,
  CreditCard,
  AlertCircle,
  BrainCircuit,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { logout } from "@/app/(auth)/actions";
import { AIChatDrawer } from "@/components/chat/AIChatDrawer";

interface User {
  id: string;
  email: string | null;
  phoneNumber: string | null;
  walletAddress: string | null;
}

export function DashboardClient({ user, isMock = false }: { user: User; isMock?: boolean }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFlipped, setIsFlipped] = useState(false);

  const whatsappNumber = "+15556698050";
  const cleanWhatsappNumber = whatsappNumber.replace(/\D/g, "");
  const whatsappUrl = `https://wa.me/${cleanWhatsappNumber}`;

  const formatAddressForCard = (addr: string) => {
    if (!addr) return "0000 0000 0000 0000";
    const clean = addr.startsWith("0x") ? addr.slice(2) : addr;
    const segments = [];
    segments.push("0x" + clean.slice(0, 2));
    for (let i = 2; i < clean.length && segments.length < 4; i += 4) {
      segments.push(clean.slice(i, i + 4));
    }
    while (segments.length < 4) {
      segments.push("0000");
    }
    return segments.join("   ");
  };

  // Dashboard state
  const [balances, setBalances] = useState({ cUSD: 0, usdc: 0, celo: 0, totalStablecoin: 0 });
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
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showChat, setShowChat] = useState(false);

  // Fetch dashboard data
  const loadData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      // Balance
      const balRes = await fetch(`/api/paycon/balance?userId=${user.id}`);
      const balData = await balRes.json();
      if (balRes.ok) {
        setBalances({
          cUSD: balData.cUSD || 0,
          usdc: balData.usdc || 0,
          celo: balData.celo || 0,
          // totalStablecoin is now returned by the API; fall back to sum if not present
          totalStablecoin: balData.totalStablecoin ?? ((balData.cUSD || 0) + (balData.usdc || 0)),
        });
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

  const copyAddress = () => {
    if (user.walletAddress) {
      navigator.clipboard.writeText(user.walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSignOut = async () => {
    await logout();
    router.push("/");
  };

  // Create Savings Goal
  const handleCreateGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/paycon/savings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          title: goalTitle,
          targetAmount: parseFloat(goalTargetAmount),
          targetDate: goalTargetDate,
        }),
      });
      if (res.ok) {
        toast.success(`Goal "${goalTitle}" created!`);
        setShowGoalModal(false);
        setGoalTitle("");
        setGoalTargetAmount("");
        setGoalTargetDate("");
        loadData(true);
      } else {
        toast.error("Failed to create goal");
      }
    } catch (err) {
      toast.error("Network error");
    }
  };

  // Create Bill
  const handleCreateBillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/paycon/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          title: billTitle,
          amount: parseFloat(billAmount),
          dueDate: billDueDate,
          frequency: billFrequency,
        }),
      });
      if (res.ok) {
        toast.success(`Bill "${billTitle}" added!`);
        setShowBillModal(false);
        setBillTitle("");
        setBillAmount("");
        setBillDueDate("");
        setBillFrequency("monthly");
        loadData(true);
      } else {
        toast.error("Failed to add bill");
      }
    } catch (err) {
      toast.error("Network error");
    }
  };

  // Contribute to Savings Goal
  const handleContributeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contributeGoalId || !contributeAmount) return;
    try {
      const res = await fetch("/api/paycon/savings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: contributeGoalId,
          userId: user.id,
          amount: parseFloat(contributeAmount),
        }),
      });
      if (res.ok) {
        toast.success("Funds saved to goal!");
        setContributeGoalId(null);
        setContributeAmount("");
        loadData(true);
      } else {
        toast.error("Failed to contribute");
      }
    } catch (err) {
      toast.error("Network error");
    }
  };

  // Pay Bill
  const handlePayBill = async (id: string, title: string, amount: number) => {
    try {
      const res = await fetch("/api/paycon/bills", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, userId: user.id, amount }),
      });
      if (res.ok) {
        toast.success(`Paid "${title}"!`);
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
    <div className="min-h-screen bg-[#040d1a] text-slate-100 flex flex-col font-sans relative overflow-x-hidden">

      {/* ── BACKGROUND (matches landing page exactly) ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Ambient radial blobs */}
        <div
          className="absolute w-[800px] h-[800px] rounded-full"
          style={{
            top: "-20%",
            left: "-10%",
            background: "radial-gradient(circle, rgba(44,168,103,0.08) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />
        <div
          className="absolute w-[600px] h-[600px] rounded-full"
          style={{
            bottom: "10%",
            right: "-5%",
            background: "radial-gradient(circle, rgba(251,204,92,0.07) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />
        <div
          className="absolute w-[400px] h-[400px] rounded-full"
          style={{
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "radial-gradient(circle, rgba(96,165,250,0.05) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />
        {/* Subtle grid mesh */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      {/* ── HEADER NAVBAR ── */}
      <motion.header
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="border-b border-white/5 bg-[#040d1a]/80 backdrop-blur-xl px-4 md:px-8 py-3 md:py-4 flex items-center justify-between sticky top-0 z-40"
      >
        {/* Logo + name */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-xl bg-yellow-400/30 blur-md" />
            <div className="relative w-9 h-9 md:w-10 md:h-10 rounded-xl bg-yellow-400 flex items-center justify-center overflow-hidden flex-shrink-0">
              <img src="/images/logo.png" alt="Paycon" className="w-full h-full object-contain" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg md:text-xl font-black tracking-tight">
                Pay<span className="text-yellow-400">con</span>
              </h1>
              <span className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse inline-block" />
                Celo Sepolia
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`inline-flex items-center gap-1 text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                isMock ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              }`}>
                <span className={`w-1 h-1 rounded-full inline-block ${isMock ? 'bg-yellow-400' : 'bg-emerald-400 animate-pulse'}`} />
                {isMock ? "Local Mode" : "Live"}
              </span>
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden lg:flex flex-col text-right text-xs">
            <span className="text-slate-200 font-semibold">{user.email}</span>
            {user.phoneNumber && <span className="text-slate-500 font-mono text-[10px]">{user.phoneNumber}</span>}
          </div>
          <button
            type="button"
            onClick={() => setShowChat(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] md:text-xs font-bold
              bg-emerald-500/10 border border-emerald-500/25 text-emerald-400
              hover:bg-emerald-500/20 hover:border-emerald-500/50
              hover:shadow-[0_0_16px_rgba(44,168,103,0.2)] transition-all duration-200"
          >
            <BrainCircuit className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">AI Chat</span>
          </button>
          <button
            type="button"
            onClick={() => setShowLogoutModal(true)}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-[11px] md:text-xs font-bold
              bg-white/[0.04] border border-white/10 text-slate-400
              hover:bg-white/[0.07] hover:text-slate-200 transition-all duration-200"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </motion.header>

      {/* ── DASHBOARD BODY ── */}
      <main className="flex-1 flex overflow-hidden relative z-10">
        <div className="flex-1 overflow-y-auto p-4 md:p-6 xl:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {isLoading && (
            <div className="fixed inset-0 bg-[#040d1a]/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-pulse-ring" />
                <div className="animate-spin rounded-full h-12 w-12 border-2 border-emerald-500/20 border-t-emerald-400" />
              </div>
              <p className="text-slate-400 text-sm font-medium">Syncing with Celo...</p>
            </div>
          )}

          {/* ── TOP CARDS ROW ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* 3D FLIPPING ATM CARD */}
            <div className="lg:col-span-2 perspective-1000 w-full h-[260px] md:h-[240px]">
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className={`relative w-full h-full duration-700 transform-style-3d cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`}
              >
                {/* FRONT */}
                <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-emerald-900/80 via-[#040d1a] to-yellow-600/30 border border-white/10 rounded-3xl p-6 flex flex-col justify-between shadow-2xl overflow-hidden">
                  <div className="absolute top-0 right-0 w-36 h-36 rounded-full pointer-events-none animate-pulse"
                    style={{ background: "radial-gradient(circle, rgba(251,204,92,0.12) 0%, transparent 70%)" }} />
                  <div className="absolute bottom-0 left-0 w-36 h-36 rounded-full pointer-events-none"
                    style={{ background: "radial-gradient(circle, rgba(44,168,103,0.10) 0%, transparent 70%)" }} />
                  {/* Top shimmer */}
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-lg font-black tracking-widest text-slate-100 uppercase">Paycon</span>
                      <p className="text-[7px] text-yellow-400 font-extrabold tracking-widest uppercase mt-0.5">Secure Web3 Vault</p>
                    </div>
                    {/* EMV Chip */}
                    <div className="w-10 h-8 bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-400 rounded-md relative shadow-inner overflow-hidden border border-yellow-200/30 flex-shrink-0">
                      <div className="absolute inset-x-0 top-1/2 h-[1px] bg-slate-950/30" />
                      <div className="absolute inset-y-0 left-1/2 w-[1px] bg-slate-950/30" />
                    </div>
                  </div>

                  <div className="my-auto pt-2">
                    <span className="text-[8px] text-slate-400 uppercase tracking-widest block mb-1 font-bold">Celo Sepolia Wallet</span>
                    <div className="text-lg md:text-xl font-mono text-slate-100 tracking-wider font-bold truncate">
                      {formatAddressForCard(user.walletAddress || "")}
                    </div>
                  </div>

                  <div className="flex justify-between items-end">
                    <div className="max-w-[70%]">
                      <span className="text-[8px] text-slate-500 uppercase tracking-wider block font-bold">Vault Owner</span>
                      <span className="text-xs font-bold text-slate-200 truncate block">{user.email}</span>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <span className="px-2 py-0.5 rounded text-[8px] font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 uppercase tracking-widest">
                        Celo Sepolia
                      </span>
                      <span className="text-[7px] text-slate-500 uppercase font-bold tracking-wider animate-pulse">Tap to view details</span>
                    </div>
                  </div>
                </div>

                {/* BACK */}
                <div className="absolute inset-0 backface-hidden rotate-y-180 bg-[#040d1a] border border-white/10 rounded-3xl p-5 flex flex-col justify-between shadow-2xl overflow-hidden">
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-yellow-400/30 to-transparent" />
                  <div className="absolute top-4 inset-x-0 h-9 bg-slate-950" />

                  <div className="mt-12 flex items-center gap-3">
                    <div className="flex-1 h-9 bg-white/[0.03] border border-white/8 rounded-xl px-3 flex items-center justify-between text-[10px] text-slate-400 font-mono overflow-hidden">
                      <span className="truncate">{user.walletAddress}</span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); copyAddress(); }}
                        className="p-1 rounded-md hover:bg-white/10 text-slate-400 hover:text-emerald-400 transition shrink-0 ml-2"
                        title="Copy Address"
                      >
                        {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                    <div className="w-12 h-9 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex flex-col items-center justify-center text-[10px] font-extrabold text-yellow-500 font-mono">
                      <span className="text-[6px] text-yellow-500/60 uppercase">CVV</span>
                      999
                    </div>
                  </div>

                  <div className="mt-3 px-1">
                    <span className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wider block">CELO Balance</span>
                    <p className="text-3xl font-black text-yellow-400 mt-1">{balances.celo.toFixed(4)} <span className="text-sm text-slate-500 font-normal">CELO</span></p>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setShowDepositModal(true); }}
                      className="flex-1 flex items-center justify-center gap-1 px-2.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold rounded-xl text-xs transition"
                    >
                      Fund Wallet
                    </button>
                    <a
                      href={`https://celo-sepolia.blockscout.com/address/${user.walletAddress}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 flex items-center justify-center gap-1 px-2.5 py-2 bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 font-bold rounded-xl text-xs transition border border-white/10"
                    >
                      Explorer
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* FINANCIAL HEALTH CARD */}
            <div className="relative rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm p-5 flex flex-col justify-between overflow-hidden">
              {/* Top shimmer */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent" />
              {/* Left accent */}
              <div className="absolute left-0 top-6 bottom-6 w-px bg-gradient-to-b from-emerald-400/0 via-emerald-400/60 to-emerald-400/0" />

              <div>
                <div className="flex items-center gap-2 mb-5">
                  <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                    <div className="w-5 h-px bg-emerald-500/50" />
                    Financial Health
                    <div className="w-5 h-px bg-emerald-500/50" />
                  </span>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <span className="text-slate-500 text-xs font-semibold">Total Capital</span>
                    <span className="font-black text-yellow-400 text-sm">{balances.celo.toFixed(4)} CELO</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <span className="text-slate-500 text-xs font-semibold">Savings Target</span>
                    <span className="font-bold text-slate-200 text-sm">
                      {goals.reduce((acc, g) => acc + Number(g.targetAmount), 0).toFixed(2)} CELO
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-xs font-semibold">Unpaid Bills</span>
                    <span className="font-bold text-yellow-400 text-sm">
                      {bills.filter((b) => !b.isPaid).length}{" "}
                      <span className="text-slate-500 text-[10px] font-normal">
                        ({bills.filter((b) => !b.isPaid).reduce((acc, b) => acc + Number(b.amount), 0).toFixed(2)} CELO)
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15 flex items-start gap-2.5 text-xs text-slate-400">
                <AlertCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">AI assistant active — click <strong className="text-emerald-400">AI Chat</strong> in the header to get personalised advice.</span>
              </div>
            </div>
          </div>

          {/* ── SAVINGS & BILLS ── */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

            {/* SAVINGS GOALS */}
            <div className="relative rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm p-5 flex flex-col gap-5 overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                    <div className="w-5 h-px bg-emerald-500/50" />
                    Savings Goals
                    <div className="w-5 h-px bg-emerald-500/50" />
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGoalModal(true)}
                  className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl
                    bg-emerald-500/10 border border-emerald-500/25 text-emerald-400
                    hover:bg-emerald-500/20 hover:border-emerald-500/50
                    hover:shadow-[0_0_12px_rgba(44,168,103,0.2)] transition-all duration-200 font-semibold"
                >
                  <Plus className="h-3.5 w-3.5" /> New Goal
                </button>
              </div>

              {goals.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
                  <TrendingUp className="h-8 w-8 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm font-medium">No savings goals yet</p>
                  <p className="text-xs text-slate-600 mt-1">Create one to start budgeting automatically.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                  {goals.map((goal) => {
                    const current = Number(goal.currentAmount);
                    const target = Number(goal.targetAmount);
                    const progress = Math.min(100, Math.round((current / target) * 100)) || 0;
                    const isCompleted = current >= target;

                    return (
                      <motion.div
                        key={goal.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/[0.03] border border-white/8 hover:border-emerald-500/25 p-4 rounded-2xl flex flex-col gap-3 relative group transition-all duration-200 hover:bg-white/[0.05]"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-extrabold text-slate-200">{goal.title}</h4>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                              Target Date: {new Date(goal.targetDate).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                              isCompleted ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-blue-600/10 text-blue-400 border border-blue-500/20"
                            }`}>
                              {progress}%
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteGoal(goal.id, goal.title)}
                              className="p-1.5 hover:bg-white/5 text-slate-500 hover:text-red-400 rounded-lg transition"
                              title="Delete Goal"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700 ease-out"
                            style={{
                              width: `${progress}%`,
                              background: isCompleted
                                ? 'linear-gradient(90deg, #2CA867, #4ade80)'
                                : 'linear-gradient(90deg, #2CA867, #60a5fa)'
                            }}
                          />
                        </div>

                        <div className="flex justify-between items-center text-xs text-slate-400">
                          <span>
                            Saved: <strong className="text-slate-200 font-bold">{current.toFixed(2)}</strong> / {target.toFixed(2)} CELO
                          </span>
                          {!isCompleted && (
                            <button
                              type="button"
                              onClick={() => setContributeGoalId(goal.id)}
                              className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 hover:underline"
                            >
                              <Plus className="h-3 w-3 stroke-[2.5]" /> Save Funds
                            </button>
                          )}
                        </div>

                        <AnimatePresence>
                          {contributeGoalId === goal.id && (
                            <motion.form
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              onSubmit={handleContributeSubmit}
                              className="mt-2 pt-2 border-t border-white/8 flex items-center gap-2 overflow-hidden"
                            >
                              <input
                                type="number"
                                placeholder="Amount in CELO"
                                value={contributeAmount}
                                onChange={(e) => setContributeAmount(e.target.value)}
                                className="bg-white/[0.04] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-emerald-500 text-slate-100 flex-1"
                                required
                              />
                              <button type="submit" className="bg-emerald-500 text-slate-950 font-extrabold px-3 py-1.5 rounded-lg text-xs hover:bg-emerald-600 transition">
                                Save
                              </button>
                              <button type="button" onClick={() => { setContributeGoalId(null); setContributeAmount(""); }} className="text-slate-400 hover:text-slate-200">
                                <X className="h-4 w-4" />
                              </button>
                            </motion.form>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* BILL PLANNER */}
            <div className="relative rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm p-5 flex flex-col gap-5 overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-yellow-400/30 to-transparent" />

              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-yellow-400">
                  <div className="w-5 h-px bg-yellow-500/50" />
                  Bill Planner
                  <div className="w-5 h-px bg-yellow-500/50" />
                </span>
                <button
                  type="button"
                  onClick={() => setShowBillModal(true)}
                  className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl
                    bg-yellow-500/10 border border-yellow-500/20 text-yellow-400
                    hover:bg-yellow-500/20 hover:border-yellow-500/50
                    hover:shadow-[0_0_12px_rgba(251,204,92,0.15)] transition-all duration-200 font-semibold"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Bill
                </button>
              </div>

              {bills.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
                  <Calendar className="h-8 w-8 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm font-medium">No bills added yet</p>
                  <p className="text-xs text-slate-600 mt-1">Add bills to track and pay them instantly.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                  {bills.map((bill) => {
                    const isPaid = bill.isPaid;
                    const dueDateStr = new Date(bill.dueDate).toLocaleDateString();

                    return (
                      <motion.div
                        key={bill.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`bg-white/[0.03] border p-4 rounded-2xl flex items-center justify-between gap-4 transition-all duration-200 hover:bg-white/[0.05] ${
                          isPaid ? 'border-emerald-500/15' : 'border-white/8 hover:border-yellow-500/20'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl border ${
                            isPaid ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-white/[0.04] border-white/10 text-slate-400"
                          }`}>
                            <CreditCard className="h-4 w-4" />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-slate-200">{bill.title}</h4>
                            <div className="flex items-center gap-2 mt-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                              <span>Due: {dueDateStr}</span>
                              <span>•</span>
                              <span className="text-blue-400">{bill.frequency}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="font-extrabold text-slate-200 block">{Number(bill.amount).toFixed(2)} CELO</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {isPaid ? (
                              <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <CheckCircle2 className="h-3 w-3" /> Paid
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handlePayBill(bill.id, bill.title, bill.amount)}
                                className="px-3 py-1.5 text-xs font-black bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-xl transition"
                              >
                                Pay
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteBill(bill.id, bill.title)}
                              className="p-1.5 hover:bg-white/5 text-slate-500 hover:text-red-400 rounded-lg transition"
                              title="Delete Bill"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── RECENT TRANSACTIONS ── */}
          <div className="relative rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm p-5 overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/30 to-transparent" />

            <div className="flex items-center justify-between mb-5">
              <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-blue-400">
                <div className="w-5 h-px bg-blue-500/50" />
                Recent Transactions
                <div className="w-5 h-px bg-blue-500/50" />
              </span>
              <button
                type="button"
                onClick={() => loadData(true)}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-200 bg-white/[0.03] border border-white/8 hover:border-white/15 transition"
                title="Refresh"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>

            {transactions.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
                <Coins className="h-8 w-8 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-400 text-sm font-medium">No transactions yet</p>
                <p className="text-xs text-slate-600 mt-1">Fund your wallet to get started.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                      <th className="pb-3">Activity</th>
                      <th className="pb-3 hidden md:table-cell">Type</th>
                      <th className="pb-3">Token</th>
                      <th className="pb-3 text-right">Amount</th>
                      <th className="pb-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {transactions.slice(0, 10).map((tx) => {
                      const isIncoming = tx.type === "deposit";
                      const amountStr = Number(tx.amount).toFixed(2);

                      return (
                        <tr key={tx.id} className="hover:bg-white/[0.03] transition-colors duration-150 rounded-xl">
                          <td className="py-3 flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${
                              isIncoming ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" : "bg-blue-500/10 border border-blue-500/20 text-blue-400"
                            }`}>
                              {isIncoming ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                            </div>
                            <div>
                              <span className="font-extrabold text-slate-200 block">
                                {tx.description || (isIncoming ? "Fund Deposit" : "Outbound Payment")}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                                {new Date(tx.createdAt).toLocaleString()}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 capitalize hidden md:table-cell text-slate-300 font-medium">
                            {tx.type.replace("_", " ")}
                          </td>
                          <td className="py-3 text-slate-300 font-mono">{tx.token}</td>
                          <td className={`py-3 text-right font-black ${isIncoming ? "text-emerald-400" : "text-slate-300"}`}>
                            {isIncoming ? "+" : "-"}${amountStr}
                          </td>
                          <td className="py-3 text-right">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              tx.status === "completed"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                            }`}>
                              {tx.status}
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
      </main>

      {/* ======================================================== */}
      {/* MODALS */}
      {/* ======================================================== */}

      {/* DEPOSIT MODAL */}
      <AnimatePresence>
        {showDepositModal && (
          <div className="fixed inset-0 bg-[#040d1a]/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 16 }}
              className="relative rounded-3xl w-full max-w-md overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.5)] border border-white/10 bg-white/[0.04] backdrop-blur-sm"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />
              <div className="px-6 py-5 border-b border-white/5 flex justify-between items-center">
                <h3 className="font-bold text-slate-100 flex items-center gap-2">
                  <ArrowDownLeft className="h-4 w-4 text-emerald-400" /> Fund Your Wallet
                </h3>
                <button type="button" onClick={() => setShowDepositModal(false)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/5 transition">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="px-6 py-5 space-y-4 text-sm text-slate-300">
                <p className="text-slate-400 text-sm leading-relaxed">
                  Fund your on-chain Celo Sepolia address with testnet CELO tokens.
                </p>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Your Celo Sepolia Address</span>
                  <div className="bg-white/[0.04] border border-white/8 rounded-xl px-4 py-3 flex items-center justify-between gap-4 font-mono text-xs overflow-hidden">
                    <span className="truncate text-slate-300 select-all">{user.walletAddress || "0x..."}</span>
                    <button
                      type="button"
                      onClick={copyAddress}
                      className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-emerald-400 transition shrink-0"
                      title="Copy Address"
                    >
                      {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="pt-2 flex flex-col gap-2">
                  <a
                    href="https://faucet.celo.org/celo-sepolia"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold py-2.5 rounded-xl
                      hover:bg-emerald-500/20 hover:border-emerald-500/60 hover:shadow-[0_0_16px_rgba(44,168,103,0.2)]
                      transition-all duration-200 text-sm text-center flex items-center justify-center gap-2"
                  >
                    Open Celo Faucet <ArrowUpRight className="h-4 w-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => setShowDepositModal(false)}
                    className="w-full bg-white/[0.04] hover:bg-white/[0.07] text-slate-300 font-medium py-2.5 rounded-xl transition text-sm border border-white/8"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE SAVINGS GOAL MODAL */}
      <AnimatePresence>
        {showGoalModal && (
          <div className="fixed inset-0 bg-[#040d1a]/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 16 }}
              className="relative rounded-3xl w-full max-w-md overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.5)] border border-white/10 bg-white/[0.04] backdrop-blur-sm"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />
              <div className="px-6 py-5 border-b border-white/5 flex justify-between items-center">
                <h3 className="font-bold text-slate-100 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-400" /> New Savings Goal
                </h3>
                <button type="button" onClick={() => setShowGoalModal(false)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/5 transition">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <form onSubmit={handleCreateGoalSubmit} className="px-6 py-5 space-y-4">
                <div>
                  <label htmlFor="goalTitle" className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Goal Name</label>
                  <input id="goalTitle" type="text" placeholder="e.g. Holiday Trip, Rainy Day Fund" value={goalTitle}
                    onChange={(e) => setGoalTitle(e.target.value)}
                    className="glass-input w-full rounded-xl px-4 py-2.5 text-sm text-slate-200" required />
                </div>
                <div>
                  <label htmlFor="goalTargetAmount" className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Target Amount (CELO)</label>
                  <input id="goalTargetAmount" type="number" placeholder="Target in CELO" value={goalTargetAmount}
                    onChange={(e) => setGoalTargetAmount(e.target.value)}
                    className="glass-input w-full rounded-xl px-4 py-2.5 text-sm text-slate-200" required />
                </div>
                <div>
                  <label htmlFor="goalTargetDate" className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Target Date</label>
                  <input id="goalTargetDate" type="date" value={goalTargetDate}
                    onChange={(e) => setGoalTargetDate(e.target.value)}
                    className="glass-input w-full rounded-xl px-4 py-2.5 text-sm text-slate-200" required />
                </div>
                <div className="pt-1">
                  <button type="submit"
                    className="w-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold py-2.5 rounded-xl
                      hover:bg-emerald-500/20 hover:border-emerald-500/60 hover:shadow-[0_0_16px_rgba(44,168,103,0.2)]
                      transition-all duration-200 text-sm">
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
          <div className="fixed inset-0 bg-[#040d1a]/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 16 }}
              className="relative rounded-3xl w-full max-w-md overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.5)] border border-white/10 bg-white/[0.04] backdrop-blur-sm"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-yellow-400/50 to-transparent" />
              <div className="px-6 py-5 border-b border-white/5 flex justify-between items-center">
                <h3 className="font-bold text-slate-100 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-yellow-400" /> Add Upcoming Bill
                </h3>
                <button type="button" onClick={() => setShowBillModal(false)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/5 transition">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <form onSubmit={handleCreateBillSubmit} className="px-6 py-5 space-y-4">
                <div>
                  <label htmlFor="billTitle" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Bill Title</label>
                  <input id="billTitle" type="text" placeholder="e.g. Netflix, Electricity, Rent" value={billTitle}
                    onChange={(e) => setBillTitle(e.target.value)}
                    className="glass-input w-full rounded-xl px-4 py-2.5 text-sm text-slate-200" required />
                </div>
                <div>
                  <label htmlFor="billAmount" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Bill Amount (CELO)</label>
                  <input id="billAmount" type="number" placeholder="Amount in CELO" value={billAmount}
                    onChange={(e) => setBillAmount(e.target.value)}
                    className="glass-input w-full rounded-xl px-4 py-2.5 text-sm text-slate-200" required />
                </div>
                <div>
                  <label htmlFor="billDueDate" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Due Date</label>
                  <input id="billDueDate" type="date" value={billDueDate}
                    onChange={(e) => setBillDueDate(e.target.value)}
                    className="glass-input w-full rounded-xl px-4 py-2.5 text-sm text-slate-200" required />
                </div>
                <div>
                  <label htmlFor="billFrequency" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Frequency</label>
                  <select id="billFrequency" value={billFrequency} onChange={(e) => setBillFrequency(e.target.value)}
                    className="glass-input w-full rounded-xl px-4 py-2.5 text-sm text-slate-200">
                    <option value="monthly">Monthly</option>
                    <option value="weekly">Weekly</option>
                    <option value="yearly">Yearly</option>
                    <option value="one-time">One-time</option>
                  </select>
                </div>
                <div className="pt-1">
                  <button type="submit"
                    className="w-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 font-semibold py-2.5 rounded-xl
                      hover:bg-yellow-500/20 hover:border-yellow-500/60 hover:shadow-[0_0_16px_rgba(251,204,92,0.15)]
                      transition-all duration-200 text-sm">
                    Add Bill to Planner
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* LOGOUT MODAL */}
      <AnimatePresence>
        {showLogoutModal && (
          <div className="fixed inset-0 bg-[#040d1a]/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 16 }}
              className="relative rounded-3xl w-full max-w-sm overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.5)] border border-white/10 bg-white/[0.04] backdrop-blur-sm"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-yellow-400/40 to-transparent" />
              <div className="px-6 py-5 border-b border-white/5 flex justify-between items-center">
                <h3 className="font-bold text-slate-100 flex items-center gap-2">
                  <LogOut className="h-4 w-4 text-yellow-400" /> Confirm Logout
                </h3>
                <button type="button" onClick={() => setShowLogoutModal(false)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/5 transition">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="px-6 py-5 space-y-5">
                <p className="text-sm text-slate-400 leading-relaxed">Are you sure you want to log out of your Paycon account?</p>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowLogoutModal(false)}
                    className="flex-1 bg-white/[0.04] hover:bg-white/[0.07] text-slate-300 font-medium py-2.5 rounded-xl transition text-sm border border-white/8">
                    Cancel
                  </button>
                  <button type="button"
                    onClick={() => { setShowLogoutModal(false); handleSignOut(); }}
                    className="flex-1 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 font-semibold py-2.5 rounded-xl
                      hover:bg-yellow-500/20 hover:border-yellow-500/60 transition-all duration-200 text-sm">
                    Logout
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AIChatDrawer
        isOpen={showChat}
        onClose={() => setShowChat(false)}
        user={user}
      />
    </div>
  );
}
