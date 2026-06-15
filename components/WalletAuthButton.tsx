"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Wallet, Loader2, AlertCircle } from "lucide-react";

const CELO_SEPOLIA_CHAIN_ID = "0xaef3"; // 44787 in hex

async function switchToCeloSepolia() {
  const ethereum = (window as any).ethereum;
  if (!ethereum) return false;

  try {
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: CELO_SEPOLIA_CHAIN_ID }],
    });
    return true;
  } catch (switchError: any) {
    // Chain not added yet — add it
    if (switchError.code === 4902) {
      try {
        await ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: CELO_SEPOLIA_CHAIN_ID,
              chainName: "Celo Alfajores Testnet",
              nativeCurrency: {
                name: "CELO",
                symbol: "CELO",
                decimals: 18,
              },
              rpcUrls: ["https://alfajores-forno.celo-testnet.org"],
              blockExplorerUrls: ["https://alfajores.celoscan.io"],
            },
          ],
        });
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }
}

interface WalletAuthButtonProps {
  className?: string;
  label?: string;
}

export function WalletAuthButton({ className = "", label = "Connect Wallet" }: WalletAuthButtonProps) {
  const router = useRouter();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = useCallback(async () => {
    if (isConnecting) return;
    setIsConnecting(true);
    setError(null);

    try {
      const ethereum = (window as any).ethereum;

      if (!ethereum) {
        setError("No wallet found. Please install MetaMask or another Celo-compatible wallet.");
        setIsConnecting(false);
        return;
      }

      // Request accounts
      const accounts: string[] = await ethereum.request({
        method: "eth_requestAccounts",
      });

      if (!accounts || accounts.length === 0) {
        setError("No accounts found. Please unlock your wallet.");
        setIsConnecting(false);
        return;
      }

      const walletAddress = accounts[0];

      // Switch to Celo Sepolia
      const switched = await switchToCeloSepolia();
      if (!switched) {
        setError("Please switch your wallet to Celo Alfajores Testnet manually.");
        setIsConnecting(false);
        return;
      }

      // Authenticate with backend — creates/fetches user in Supabase
      const res = await fetch("/api/paycon/wallet-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress }),
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setError(data.error || "Authentication failed. Please try again.");
        setIsConnecting(false);
      }
    } catch (err: any) {
      if (err?.code === 4001) {
        setError("Connection rejected. Please approve the wallet request.");
      } else {
        setError("Something went wrong. Please try again.");
      }
      setIsConnecting(false);
    }
  }, [isConnecting, router]);

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <button
        type="button"
        onClick={handleConnect}
        disabled={isConnecting}
        className="relative group inline-flex items-center gap-3 font-extrabold text-slate-950 rounded-2xl px-7 py-3.5 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden"
        style={{
          background: isConnecting
            ? "linear-gradient(135deg, #d4a800 0%, #1a7a4a 100%)"
            : "linear-gradient(135deg, #FBCC5C 0%, #F0A500 50%, #2CA867 100%)",
          boxShadow: "0 8px 32px rgba(251,204,92,0.30), 0 2px 8px rgba(0,0,0,0.3)",
          fontSize: "15px",
          letterSpacing: "0.02em",
        }}
      >
        {/* Shimmer effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.25) 50%, transparent 60%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.5s infinite",
          }}
        />

        {isConnecting ? (
          <Loader2 className="h-5 w-5 animate-spin shrink-0" />
        ) : (
          <Wallet className="h-5 w-5 shrink-0" />
        )}
        <span>{isConnecting ? "Connecting..." : label}</span>
      </button>

      {error && (
        <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-3 max-w-xs">
          <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
          <p className="text-red-400 text-xs leading-relaxed">{error}</p>
        </div>
      )}
    </div>
  );
}
