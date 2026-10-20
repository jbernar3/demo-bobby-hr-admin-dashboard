import type { Metadata } from "next";
import { ComplianceView } from "@/components/compliance/ComplianceView";

export const metadata: Metadata = { title: "Compliance" };

export default function CompliancePage() {
  return <ComplianceView />;
}
