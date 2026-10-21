// Shared domain types for the Keel demo. All data is fictitious.

export type ISODate = string; // "YYYY-MM-DD"

export type StateCode =
  | "NY"
  | "NJ"
  | "CA"
  | "TX"
  | "CO"
  | "WA"
  | "MA"
  | "IL"
  | "FL"
  | "OR";

export type Department =
  | "Engineering"
  | "Product/Design"
  | "Sales"
  | "Customer Success"
  | "Ops/Finance/People"
  | "Leadership";

export type EmploymentType = "Full-time" | "Part-time";

/** EE = employee only, ES = EE+Spouse, EC = EE+Child(ren), FAM = Family */
export type Tier = "EE" | "ES" | "EC" | "FAM";

export type MedicalPlanId = "ppo500" | "ppo1500" | "hdhp3000";

/** Lines of coverage billed per-tier. Life/disability is billed per covered employee. */
export type TieredLine = "medical" | "dental" | "vision";
export type Line = TieredLine | "life";

export type CarrierId = "meridian" | "brightline" | "clearview" | "anchor" | "keystone";

export interface Dependent {
  name: string;
  relationship: "Spouse" | "Child";
  dob: ISODate;
  /** Date the dependent was added to coverage, if added during 2026. */
  addedOn?: ISODate;
}

export interface Coverage {
  medical: { plan: MedicalPlanId; tier: Tier } | null;
  dental: Tier | null;
  vision: Tier | null;
}

/** Coverage that applied before a change (e.g. a tier change after a life event). */
export interface PriorCoverage {
  /** Last day this prior coverage applied. */
  until: ISODate;
  medical?: Tier;
  dental?: Tier;
  vision?: Tier;
}

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  department: Department;
  state: StateCode;
  city: string;
  hireDate: ISODate;
  terminationDate?: ISODate;
  type: EmploymentType;
  /** Part-time only: average weekly hours by month, Jan 2026 onward (index 0 = Jan). */
  weeklyHoursByMonth?: number[];
  email: string;
  coverage: Coverage;
  priorCoverage?: PriorCoverage[];
  /** Waived medical (eligible but declined). */
  waivedMedical?: boolean;
  dependents: Dependent[];
  status: "Active" | "Terminated";
}

export interface MedicalPlan {
  id: MedicalPlanId;
  name: string;
  deductible: number;
  oopMax: number;
  coinsurance: string;
  pcpCopay: string;
  hsaEligible: boolean;
  rates: Record<Tier, number>;
}

export interface Carrier {
  id: CarrierId;
  name: string;
  line: string;
  shortName: string;
}

export type FindingType =
  | "Ghost enrollee"
  | "Tier mismatch"
  | "Missing from invoice"
  | "Underbilled";

export type FindingStatus =
  | "Open"
  | "Credit requested"
  | "Correction requested"
  | "Recovered";

export interface Finding {
  id: string;
  employeeId: string;
  line: TieredLine;
  carrierId: CarrierId;
  type: FindingType;
  /** Months affected, as "YYYY-MM". */
  months: string[];
  /** The tier the carrier invoice billed (null = not on invoice). */
  billedTier: Tier | null;
  status: FindingStatus;
  detectedOn: ISODate;
  resolvedOn?: ISODate;
  /** Approval action that moves this finding forward. */
  actionId?: string;
  statusAfterApproval?: FindingStatus;
  summary: string;
}

export type ComplianceStatus = "Done" | "Due soon" | "Overdue" | "Needs info" | "Not required";
export type Owner = "Keel" | "Dana" | "Advisor";

export interface ComplianceItem {
  id: string;
  title: string;
  rule: string;
  explanation: string;
  owner: Owner;
  dueDate?: ISODate;
  /** Free text when there is no hard date, e.g. "With OE materials". */
  dueLabel?: string;
  completedOn?: ISODate;
  status: ComplianceStatus;
  category: "Federal" | "State" | "Plan documents" | "Local";
  /** State this item applies to; employee counts are computed from it. */
  state?: StateCode;
  /** Points this item subtracts from the 100-point health score while open. */
  scoreWeight: number;
  penalty?: { perUnit: number; unit: "day" | "failure"; units?: number; note?: string };
  actionId?: string;
  statusAfterApproval?: ComplianceStatus;
  noteAfterApproval?: string;
  weightAfterApproval?: number;
  note?: string;
  link?: { href: string; label: string };
}

export interface CaseEvent {
  at: string; // "YYYY-MM-DD HH:mm"
  actor: "Keel" | "Marco" | "Carrier" | "Dana";
  channel: "Call" | "Email" | "Portal" | "Note" | "Slack";
  summary: string;
}

export interface CarrierCase {
  id: string;
  title: string;
  carrierId: CarrierId;
  employeeId?: string;
  openedOn: ISODate;
  owner: "Keel" | "Marco";
  status: "Waiting on carrier" | "In progress" | "Escalated" | "Resolved";
  nextStep: string;
  events: CaseEvent[];
}

export interface ActivityItem {
  id: string;
  at: string; // display time label, e.g. "4:12 AM"
  text: string;
  detail?: string;
  href?: string;
}

export type Urgency = "today" | "week" | "later";

export interface ApprovalAction {
  id: string;
  title: string;
  why: string;
  urgency: Urgency;
  dueDate?: ISODate;
  amount?: number;
  amountLabel?: string;
  href: string;
  toast: string;
  feed: string;
  approveLabel?: string;
}

export type OEStatus = "Not started" | "In progress" | "Complete" | "Waived";

export type AnswerBlock =
  | { type: "text"; text: string }
  | { type: "stat"; value: string; label: string }
  | { type: "table"; columns: string[]; rows: string[][] }
  | { type: "action"; label: string; actionId?: string; href?: string; demo?: string };

export interface ScriptedAnswer {
  id: string;
  question: string;
  keywords: string[][];
  blocks: AnswerBlock[];
}
