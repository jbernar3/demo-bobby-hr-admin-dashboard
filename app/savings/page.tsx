import type { Metadata } from "next";
import { Suspense } from "react";
import { SavingsView } from "@/components/savings/SavingsView";

export const metadata: Metadata = { title: "Savings" };

export default function SavingsPage() {
  return (
    <Suspense>
      <SavingsView />
    </Suspense>
  );
}
