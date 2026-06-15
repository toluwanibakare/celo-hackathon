"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { WalletAuthButton } from "@/components/WalletAuthButton";
import {
  Wallet,
  BrainCircuit,
  TrendingUp,
  Shield,
  Zap,
  Globe,
  ChevronRight,
  Star,
  ArrowRight,
  Activity,
  CreditCard,
  Lock,
  Sparkles,
} from "lucide-react";

// ─── Floating Particle ────────────────────────────────────────────────────────
function Particle({ delay, duration, x, y, size }: any) {
  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: size,
        height: size,
        background: "radial-gradient(circle, rgba(251,204,92,0.6) 0%, rgba(44,168,103,0.3) 100%)",
        filter: "blur(1px)",
      }}
      animate={{
        y: [-20, 20, -20],
        x: [-10, 10, -10],
        opacity: [0.3, 0.8, 0.3],
        scale: [0.8, 1.2, 0.8],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

// ─── Animated Counter ─────────────────────────────────────────────────────────
function AnimatedCounter({ target, suffix = "", prefix = "" }: { target: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
          let start = 0;
          const step = target / 60;
          const timer = setInterval(() => {
            start += step;
            if (start >= target) {
              setCount(target);
              clearInterval(timer);
            } else {
              setCount(Math.floor(start));
            }
          }, 16);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, started]);

  return (
    <span ref={ref}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}

// ─── Feature Card ─────────────────────────────────────────────────────────────
function FeatureCard({ icon: Icon, title, description, color, delay, gradient }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      viewport={{ once: true }}
      whileHover={{ y: -6, scale: 1.02 }}
      className="relative group cursor-default"
    >
      {/* Background glow — behind card content */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-60 transition-opacity duration-500 blur-xl -z-10"
        style={{ background: gradient }}
      />
      <div className="relative rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm p-6 h-full overflow-hidden group-hover:border-white/25 transition-all duration-300">
        {/* Top shimmer */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        {/* Icon */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
          style={{ background: gradient }}
        >
          <Icon className="h-6 w-6 text-slate-950" />
        </div>

        <h3 className="text-lg font-bold text-slate-100 mb-2 relative z-10">{title}</h3>
        <p className="text-sm text-slate-300 leading-relaxed relative z-10">{description}</p>

        {/* Hover glow corner */}
        <div
          className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full opacity-0 group-hover:opacity-30 transition-opacity duration-500 blur-2xl"
          style={{ background: color }}
        />
      </div>
    </motion.div>
  );
}

// ─── MAIN LANDING PAGE ────────────────────────────────────────────────────────
export default function LandingPage() {
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 600], [0, -120]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);

  const particles = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 6 + 3,
    delay: Math.random() * 4,
    duration: Math.random() * 6 + 5,
  }));

  const features = [
    {
      icon: BrainCircuit,
      title: "AI Financial Coach",
      description: "Get personalized financial advice powered by cutting-edge AI. Your smart money mentor available 24/7 on Celo.",
      color: "#2CA867",
      gradient: "linear-gradient(135deg, #2CA867, #1a7a4a)",
      delay: 0,
    },
    {
      icon: Wallet,
      title: "Native CELO Wallet",
      description: "Your on-chain Celo Sepolia wallet, automatically created and managed. Real blockchain, real assets.",
      color: "#FBCC5C",
      gradient: "linear-gradient(135deg, #FBCC5C, #F0A500)",
      delay: 0.1,
    },
    {
      icon: TrendingUp,
      title: "Savings Goals",
      description: "Set CELO savings goals and track your progress. Visualize milestones with beautiful charts and milestones.",
      color: "#60a5fa",
      gradient: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
      delay: 0.2,
    },
    {
      icon: CreditCard,
      title: "Bill Planner",
      description: "Schedule recurring bills in CELO, get reminders, and never miss a payment with smart automation.",
      color: "#f472b6",
      gradient: "linear-gradient(135deg, #ec4899, #9d174d)",
      delay: 0.3,
    },
    {
      icon: Activity,
      title: "Live Transactions",
      description: "Real-time on-chain transaction history synced from Celo Sepolia Blockscout. Full transparency.",
      color: "#34d399",
      gradient: "linear-gradient(135deg, #10b981, #059669)",
      delay: 0.4,
    },
    {
      icon: Shield,
      title: "Wallet-First Security",
      description: "No passwords, no email — just your crypto wallet. You own your identity and your keys.",
      color: "#a78bfa",
      gradient: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
      delay: 0.5,
    },
  ];

  return (
    <div className="min-h-screen bg-[#040d1a] text-slate-100 overflow-x-hidden">

      {/* ── BACKGROUND MESH ─────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Large ambient blobs */}
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

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: "64px 64px",
          }}
        />

        {/* Particles */}
        {particles.map((p) => (
          <Particle key={p.id} {...p} />
        ))}
      </div>

      {/* ── NAVBAR ──────────────────────────────────────────── */}
      <motion.nav
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 backdrop-blur-xl border-b border-white/5"
        style={{ background: "rgba(4,13,26,0.85)" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-xl bg-yellow-400/30 blur-md" />
            <div className="relative w-9 h-9 rounded-xl bg-yellow-400 flex items-center justify-center overflow-hidden">
              <img src="/images/logo.png" alt="Paycon" className="w-full h-full object-contain" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-extrabold tracking-tight">
              Pay<span className="text-yellow-400">con</span>
            </span>
            <span className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Celo Sepolia
            </span>
          </div>
        </div>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-8 text-sm text-slate-400">
          <a href="#features" className="hover:text-slate-100 transition">Features</a>
          <a href="#how-it-works" className="hover:text-slate-100 transition">How it works</a>
          <a href="#stats" className="hover:text-slate-100 transition">Stats</a>
        </div>

        {/* CTA */}
        <WalletAuthButton label="Connect Wallet" />
      </motion.nav>

      {/* ── HERO SECTION ────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center px-4 pt-20">
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-10 text-center max-w-5xl mx-auto">

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-500/30 bg-emerald-500/5 text-sm text-emerald-400 mb-8"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI-Powered Crypto Finance on Celo</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-5xl md:text-7xl font-black tracking-tight leading-[1.05] mb-6"
          >
            <span className="text-slate-100">Your Money.</span>
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #FBCC5C 0%, #2CA867 60%, #60a5fa 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              On-Chain. Smarter.
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.7 }}
            className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Paycon is your AI-driven financial dashboard built on{" "}
            <span className="text-emerald-400 font-semibold">Celo</span>. Manage CELO
            savings, automate bills, and get real-time AI coaching — all with just your wallet.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <WalletAuthButton
              label="Launch App — Connect Wallet"
              className="scale-110"
            />
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            className="flex flex-wrap items-center justify-center gap-6 mt-12 text-xs text-slate-500"
          >
            {[
              { icon: Shield, text: "Non-custodial" },
              { icon: Lock, text: "Wallet-based auth" },
              { icon: Globe, text: "Celo Sepolia Testnet" },
              { icon: Zap, text: "Real-time AI" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5 text-slate-600" />
                <span>{text}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Animated CELO ring */}
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 opacity-20">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="w-[500px] h-[500px] rounded-full border border-emerald-500/30"
            style={{ borderStyle: "dashed" }}
          />
        </div>
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 opacity-15">
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="w-[350px] h-[350px] rounded-full border border-yellow-400/30"
          />
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-4 h-7 rounded-full border border-white/15 flex items-start justify-center pt-1.5">
            <div className="w-0.5 h-2 rounded-full bg-white/30" />
          </div>
        </motion.div>
      </section>

      {/* ── STATS SECTION ───────────────────────────────────── */}
      <section id="stats" className="py-20 px-4 relative">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: 5000, suffix: "+", label: "Active Accounts", color: "#FBCC5C" },
              { value: 25000, suffix: "+", label: "Automated Transactions", color: "#2CA867" },
              { value: 99, suffix: "%", label: "Uptime", color: "#60a5fa" },
              { value: 5, suffix: "s", label: "Avg Response Time", color: "#f472b6" },
            ].map(({ value, suffix, label, color }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="text-center p-6 rounded-2xl border border-white/8 bg-white/[0.03]"
              >
                <div className="text-3xl md:text-4xl font-black mb-1" style={{ color }}>
                  <AnimatedCounter target={value} suffix={suffix} />
                </div>
                <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">{label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES SECTION ────────────────────────────────── */}
      <section id="features" className="py-24 px-4 relative">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-400 mb-4">
              <div className="w-8 h-px bg-emerald-500/50" />
              Features
              <div className="w-8 h-px bg-emerald-500/50" />
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-slate-100 mb-4">
              Everything you need to{" "}
              <span
                style={{
                  background: "linear-gradient(90deg, #FBCC5C, #2CA867)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                master your money
              </span>
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto text-base">
              A complete DeFi-native financial toolkit powered by AI and running on the Celo blockchain.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-4 relative">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-yellow-400 mb-4">
              <div className="w-8 h-px bg-yellow-500/50" />
              How it works
              <div className="w-8 h-px bg-yellow-500/50" />
            </span>
            <h2 className="text-4xl font-black text-slate-100">
              Three steps to financial clarity
            </h2>
          </motion.div>

          <div className="relative">
            {/* Connector line */}
            <div className="absolute left-8 top-8 bottom-8 w-px bg-gradient-to-b from-yellow-400/50 via-emerald-400/50 to-blue-400/50 hidden md:block" />

            <div className="space-y-8">
              {[
                {
                  step: "01",
                  title: "Connect Your Wallet",
                  desc: "Click 'Connect Wallet', approve in MetaMask (or any wallet), switch to Celo Sepolia. Your account is created automatically — no email, no password.",
                  color: "#FBCC5C",
                },
                {
                  step: "02",
                  title: "Set Up Your Goals",
                  desc: "Create CELO savings goals, schedule recurring bills, and configure your financial targets. The AI coach helps you plan intelligently.",
                  color: "#2CA867",
                },
                {
                  step: "03",
                  title: "Track & Grow",
                  desc: "Monitor live on-chain balances, view transaction history from Blockscout, chat with your AI coach, and watch your finances grow.",
                  color: "#60a5fa",
                },
              ].map(({ step, title, desc, color }, i) => (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, duration: 0.6 }}
                  className="flex gap-6 items-start group"
                >
                  {/* Step circle */}
                  <div
                    className="flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center text-slate-950 font-black text-lg shadow-lg z-10"
                    style={{ background: color }}
                  >
                    {step}
                  </div>

                  <div className="flex-1 p-6 rounded-2xl border border-white/8 bg-white/[0.03] group-hover:border-white/15 transition-all">
                    <h3 className="text-xl font-bold text-slate-100 mb-2">{title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA SECTION ─────────────────────────────────────── */}
      <section className="py-32 px-4 relative">
        <div className="max-w-3xl mx-auto text-center relative">
          {/* Glow */}
          <div
            className="absolute inset-0 rounded-3xl opacity-30 blur-3xl"
            style={{ background: "linear-gradient(135deg, rgba(251,204,92,0.3), rgba(44,168,103,0.3))" }}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative p-12 rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-sm overflow-hidden"
          >
            {/* Inner shimmer */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-yellow-400/50 to-transparent" />

            <Sparkles className="h-12 w-12 text-yellow-400 mx-auto mb-6 animate-pulse" />
            <h2 className="text-4xl md:text-5xl font-black text-slate-100 mb-4">
              Ready to take control?
            </h2>
            <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto">
              Join Paycon today. Connect your wallet, set your goals, and let AI guide your financial journey on Celo.
            </p>
            <WalletAuthButton label="Connect Wallet — It's Free" className="justify-center" />

            <p className="text-xs text-slate-600 mt-6">
              No email. No password. Just your wallet.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-yellow-400 flex items-center justify-center overflow-hidden">
                <img src="/images/logo.png" alt="Paycon" className="w-full h-full object-contain" />
              </div>
              <span className="font-extrabold text-lg">
                Pay<span className="text-yellow-400">con</span>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <Globe className="h-3 w-3" />
                Built on Celo
              </span>
              <span className="flex items-center gap-1.5">
                <Shield className="h-3 w-3" />
                Non-custodial
              </span>
              <span className="flex items-center gap-1.5">
                <Zap className="h-3 w-3" />
                AI-Powered
              </span>
              <span className="flex items-center gap-1.5">
                <Star className="h-3 w-3" />
                Open Source
              </span>
            </div>

            <p className="text-xs text-slate-600">
              © 2026 Paycon · Celo Hackathon Build
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
