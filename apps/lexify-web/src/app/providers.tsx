"use client";

import { SessionProvider } from "next-auth/react";
import { ExtensionBridge } from "./ExtensionBridge";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ExtensionBridge />
      {children}
    </SessionProvider>
  );
}
