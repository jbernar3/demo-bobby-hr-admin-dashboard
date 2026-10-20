import { medicalPlans } from "@/data/plans";
import { coverageEffective } from "@/lib/billing";
import { DEMO_TODAY, fmtShort } from "@/lib/dates";
import type { Employee } from "@/lib/types";

export function medicalLabel(e: Employee): { text: string; muted: boolean } {
  if (e.coverage.medical) {
    const plan = medicalPlans.find((p) => p.id === e.coverage.medical!.plan);
    return { text: `${plan?.name.replace(" + HSA", "")} · ${e.coverage.medical.tier}`, muted: false };
  }
  if (e.status === "Terminated") return { text: "—", muted: true };
  if (e.type === "Part-time") return { text: "Not eligible (PT)", muted: true };
  if (e.waivedMedical) return { text: "Waived", muted: true };
  if (coverageEffective(e) > DEMO_TODAY) return { text: `Eligible ${fmtShort(coverageEffective(e))}`, muted: true };
  return { text: "Not enrolled", muted: true };
}
