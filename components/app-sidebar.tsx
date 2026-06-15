"use client";

type User = { email?: string | null };
import { useRouter } from "next/navigation";

import { PlusIcon } from "@/components/icons";
import { SidebarHistory } from "@/components/sidebar-history";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  useSidebar,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { WalletConnect } from "./wallet-connect";

export function AppSidebar({ user }: { user: User | undefined }) {
  const router = useRouter();
  const { setOpenMobile } = useSidebar();

  return (
    <Sidebar className="group-data-[side=left]:border-r-0">
      <SidebarHeader className="border-b border-border/40 pb-3">
        <SidebarMenu>
          <div className="flex flex-row justify-between items-center px-1">
            {/* Brand */}
            <div className="flex items-center gap-2.5">
              <Link
                href="/"
                onClick={() => setOpenMobile(false)}
                className="flex flex-row gap-2.5 items-center group"
              >
                {/* Live dot */}
                <div className="relative flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/25">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <span className="text-base font-bold tracking-tight gradient-text-green">
                  Paycon
                </span>
              </Link>

              {user && (
                <Link
                  href="/dashboard"
                  onClick={() => setOpenMobile(false)}
                  className="text-[11px] font-semibold px-2 py-0.5 rounded-full
                    bg-emerald-500/10 text-emerald-400 border border-emerald-500/25
                    hover:bg-emerald-500/20 hover:border-emerald-500/40 transition-all duration-200"
                >
                  Dashboard
                </Link>
              )}
            </div>

            {/* New Chat button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  type="button"
                  className="p-2 h-fit rounded-xl hover:bg-emerald-500/10 hover:text-emerald-400 border border-transparent hover:border-emerald-500/20 transition-all duration-200"
                  onClick={() => {
                    setOpenMobile(false);
                    router.push("/");
                    router.refresh();
                  }}
                >
                  <PlusIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent align="end">New Chat</TooltipContent>
            </Tooltip>
          </div>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarHistory user={user} />
      </SidebarContent>

      <SidebarFooter className="border-t border-border/40 pt-2">
        <div className="px-2 py-1">
          <WalletConnect />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

