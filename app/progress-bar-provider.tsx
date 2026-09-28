"use client";

import "@bprogress/core/css";
import { ProgressProvider } from "@bprogress/next/app";

export default function ProgressBarProvider({ children }: { children: React.ReactNode }) {
  return (
    <ProgressProvider
      height="4px"
      color="#ffffff"
      options={{ showSpinner: false }}
      startPosition={0.08}
      delay={0}
      stopDelay={300}
      shallowRouting
    >
      {children}
    </ProgressProvider>
  );
}
