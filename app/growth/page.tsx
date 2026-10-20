import type { Metadata } from "next";
import { GrowthView } from "@/components/growth/GrowthView";

export const metadata: Metadata = { title: "Growth Alerts" };

export default function GrowthPage() {
  return <GrowthView />;
}
