"use client";

import type { ChatMessage } from "@/lib/types";
import type { UseChatHelpers } from "@ai-sdk/react";
import { motion } from "framer-motion";
import { memo } from "react";
import type { VisibilityType } from "./visibility-selector";

interface SuggestedActionsProps {
  chatId: string;
  sendMessage: UseChatHelpers<ChatMessage>["sendMessage"];
  selectedVisibilityType: VisibilityType;
}

function PureSuggestedActions({
  chatId,
  sendMessage,
  selectedVisibilityType,
}: SuggestedActionsProps) {
  const suggestedActions = [
    {
      icon: "💰",
      title: "Check wallet balance",
      label: "in CELO and USD",
      action:
        "Get my CELO balance for 0xYourWalletAddress. Show both CELO and USD.",
    },
    {
      icon: "⛓️",
      title: "Get latest block",
      label: "number on Celo",
      action: "What is the latest Celo block number?",
    },
    {
      icon: "🪙",
      title: "Find token balance",
      label: "USDC for my address",
      action:
        "Get my USDC token balance for 0xYourWalletAddress on Celo. Resolve the token by symbol if needed.",
    },
    {
      icon: "🔍",
      title: "Resolve ENS name",
      label: "to wallet address",
      action: "Resolve vitalik.eth to its wallet address.",
    },
  ];

  return (
    <div
      data-testid="suggested-actions"
      className="grid sm:grid-cols-2 gap-3 w-full"
    >
      {suggestedActions.map((suggestedAction, index) => (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.06 * index, duration: 0.4, ease: "easeOut" }}
          key={`suggested-action-${suggestedAction.title}-${index}`}
          className={index > 1 ? "hidden sm:block" : "block"}
        >
          <button
            type="button"
            onClick={async () => {
              window.history.replaceState({}, "", `/chat/${chatId}`);
              sendMessage({
                role: "user",
                parts: [{ type: "text", text: suggestedAction.action }],
              });
            }}
            className="group w-full text-left rounded-2xl px-4 py-4 flex gap-3 items-start
              border border-border/60 bg-card/40 backdrop-blur-sm
              hover:border-emerald-500/40 hover:bg-emerald-500/5
              hover:shadow-[0_4px_20px_rgba(44,168,103,0.12)]
              transition-all duration-200 ease-out hover:-translate-y-0.5
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
          >
            {/* Icon */}
            <span className="text-xl shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-200">
              {suggestedAction.icon}
            </span>
            {/* Text */}
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold text-sm text-foreground group-hover:text-emerald-400 transition-colors duration-200">
                {suggestedAction.title}
              </span>
              <span className="text-xs text-muted-foreground leading-relaxed">
                {suggestedAction.label}
              </span>
            </div>
            {/* Arrow */}
            <span className="ml-auto self-center text-muted-foreground/40 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all duration-200 shrink-0 text-sm">
              →
            </span>
          </button>
        </motion.div>
      ))}
    </div>
  );
}

export const SuggestedActions = memo(
  PureSuggestedActions,
  (prevProps, nextProps) => {
    if (prevProps.chatId !== nextProps.chatId) return false;
    if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType)
      return false;

    return true;
  }
);

