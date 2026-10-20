import type { Carrier, CarrierId, MedicalPlan, Tier } from "@/lib/types";

export const carriers: Record<CarrierId, Carrier> = {
  meridian: { id: "meridian", name: "Meridian Health", shortName: "Meridian", line: "Medical (level-funded)" },
  brightline: { id: "brightline", name: "Brightline Dental", shortName: "Brightline", line: "Dental PPO" },
  clearview: { id: "clearview", name: "ClearView Vision", shortName: "ClearView", line: "Vision" },
  anchor: { id: "anchor", name: "Anchor Life", shortName: "Anchor", line: "Life, AD&D, STD, LTD" },
  keystone: { id: "keystone", name: "Keystone Admin", shortName: "Keystone", line: "FSA/HSA + COBRA administration" },
};

export const TIER_LABEL: Record<Tier, string> = {
  EE: "EE only",
  ES: "EE + Spouse",
  EC: "EE + Child(ren)",
  FAM: "Family",
};

export const TIERS: Tier[] = ["EE", "ES", "EC", "FAM"];

/** Monthly total premium (employer + employee) by tier. */
export const medicalPlans: MedicalPlan[] = [
  {
    id: "ppo500",
    name: "PPO 500",
    deductible: 500,
    oopMax: 3500,
    coinsurance: "90%",
    pcpCopay: "$20",
    hsaEligible: false,
    rates: { EE: 980, ES: 2150, EC: 1890, FAM: 3050 },
  },
  {
    id: "ppo1500",
    name: "PPO 1500",
    deductible: 1500,
    oopMax: 5000,
    coinsurance: "80%",
    pcpCopay: "$30",
    hsaEligible: false,
    rates: { EE: 870, ES: 1910, EC: 1670, FAM: 2700 },
  },
  {
    id: "hdhp3000",
    name: "HDHP 3000 + HSA",
    deductible: 3000,
    oopMax: 6500,
    coinsurance: "80%",
    pcpCopay: "Ded. then 20%",
    hsaEligible: true,
    rates: { EE: 700, ES: 1550, EC: 1360, FAM: 2210 },
  },
];

export const medicalContribution = {
  /** Employer share of the EE-only premium. */
  employeeOnlyPct: 0.85,
  /** Employer share of the dependent portion (premium above EE-only). */
  dependentPct: 0.6,
};

/** Level-funded structure: each medical premium dollar splits into these buckets. */
export const levelFunded = {
  adminFeePct: 0.11,
  stopLossPct: 0.25,
  claimsFundPct: 0.64,
  specificDeductible: 50_000,
  aggregateAttachment: "125% of expected claims",
  surplusRefundPct: 0.5,
};

export const dentalPlan = {
  name: "Brightline Dental PPO",
  annualMax: 1500,
  deductible: 50,
  coverage: "100 / 80 / 50",
  orthodontia: "50% to $1,500 lifetime (children)",
  rates: { EE: 46, ES: 92, EC: 104, FAM: 152 } as Record<Tier, number>,
  contribution: { employeeOnlyPct: 0.75, dependentPct: 0.5 },
};

export const visionPlan = {
  name: "ClearView Vision",
  exam: "$10 copay, every 12 months",
  frames: "$150 allowance",
  contacts: "$150 allowance",
  rates: { EE: 9.4, ES: 17.8, EC: 18.9, FAM: 27.6 } as Record<Tier, number>,
  contribution: { employeeOnlyPct: 1, dependentPct: 0 },
};

/** Anchor Life: employer-paid, billed per covered employee per month. */
export const lifeDisability = {
  basicLife: { name: "Basic Life / AD&D", benefit: "$50,000 flat", ratePerEmployee: 10.5 },
  std: { name: "Short-Term Disability", benefit: "60% of pay to $1,500/wk, 12 weeks", ratePerEmployee: 24.1 },
  ltd: { name: "Long-Term Disability", benefit: "60% of pay to $10,000/mo", ratePerEmployee: 18.6 },
};

export const LIFE_RATE_PER_EMPLOYEE =
  lifeDisability.basicLife.ratePerEmployee + lifeDisability.std.ratePerEmployee + lifeDisability.ltd.ratePerEmployee;

export const accountsAdmin = {
  hsa: "Employer seeds $500 (EE) / $1,000 (with dependents) per year",
  fsa: "Healthcare FSA up to IRS limit; Dependent Care FSA",
  cobra: "Keystone Admin issues COBRA notices on Bobby's instruction",
};
