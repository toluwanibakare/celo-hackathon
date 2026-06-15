"use client";

import type { ReactNode } from "react";
import { ThirdwebProvider } from "thirdweb/react";
import { useEffect, useState } from "react";

export function ThirdwebClientProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return <ThirdwebProvider>{children}</ThirdwebProvider>;
}
