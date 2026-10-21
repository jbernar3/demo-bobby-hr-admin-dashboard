import type {
  Coverage,
  Department,
  Dependent,
  Employee,
  MedicalPlanId,
  PriorCoverage,
  StateCode,
  Tier,
} from "@/lib/types";

// Fictitious people. No SSNs, salaries, or health conditions anywhere.

interface Input {
  id: string;
  first: string;
  last: string;
  title: string;
  dept: Department;
  state: StateCode;
  city: string;
  hired: string;
  terminated?: string;
  /** Part-time employees: average weekly hours by month from Jan 2026. */
  hours?: number[];
  med?: [MedicalPlanId, Tier];
  dental?: Tier;
  vision?: Tier;
  waived?: boolean;
  deps?: Dependent[];
  prior?: PriorCoverage[];
}

function emailFor(first: string, last: string) {
  const clean = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-zA-Z-]/g, "")
      .toLowerCase();
  return `${clean(first)}.${clean(last)}@parallaxlabs.example`;
}

function e(i: Input): Employee {
  const coverage: Coverage = {
    medical: i.med ? { plan: i.med[0], tier: i.med[1] } : null,
    dental: i.dental ?? null,
    vision: i.vision ?? null,
  };
  return {
    id: i.id,
    firstName: i.first,
    lastName: i.last,
    title: i.title,
    department: i.dept,
    state: i.state,
    city: i.city,
    hireDate: i.hired,
    terminationDate: i.terminated,
    type: i.hours ? "Part-time" : "Full-time",
    weeklyHoursByMonth: i.hours,
    email: emailFor(i.first, i.last),
    coverage,
    priorCoverage: i.prior,
    waivedMedical: i.waived,
    dependents: i.deps ?? [],
    status: i.terminated ? "Terminated" : "Active",
  };
}

const spouse = (name: string, dob: string, addedOn?: string): Dependent => ({
  name,
  relationship: "Spouse",
  dob,
  addedOn,
});
const child = (name: string, dob: string, addedOn?: string): Dependent => ({
  name,
  relationship: "Child",
  dob,
  addedOn,
});

export const employees: Employee[] = [
  // ── Leadership ───────────────────────────────────────────────
  e({ id: "e01", first: "Noah", last: "Feldman", title: "CEO & Co-founder", dept: "Leadership", state: "NY", city: "New York", hired: "2022-03-01", med: ["ppo500", "FAM"], dental: "FAM", vision: "FAM", deps: [spouse("Rachel Feldman", "1988-05-14"), child("Eli Feldman", "2019-08-02"), child("Maya Feldman", "2022-01-19")] }),
  e({ id: "e02", first: "Imani", last: "Carter", title: "CTO & Co-founder", dept: "Leadership", state: "NY", city: "Brooklyn", hired: "2022-03-01", med: ["ppo500", "ES"], dental: "ES", vision: "ES", deps: [spouse("Malik Carter", "1989-11-03")] }),
  e({ id: "e03", first: "Rafael", last: "Santos", title: "Chief Revenue Officer", dept: "Leadership", state: "CA", city: "San Francisco", hired: "2024-02-12", med: ["ppo500", "FAM"], dental: "FAM", vision: "FAM", deps: [spouse("Isabel Santos", "1980-06-30"), child("Tomás Santos", "2010-11-11")] }),

  // ── Engineering ──────────────────────────────────────────────
  // Story: dependent child turned 26 on May 12, 2026; still billed at Family.
  e({ id: "e04", first: "Jordan", last: "Kim", title: "Director of Engineering", dept: "Engineering", state: "WA", city: "Seattle", hired: "2023-01-09", med: ["ppo1500", "FAM"], dental: "FAM", vision: "FAM", deps: [spouse("Min-ji Kim", "1974-04-02"), child("Daniel Kim", "2000-05-12")] }),
  // Story: baby born Jun 8, 2026. Child not yet added (pending life event).
  e({ id: "e05", first: "Aisha", last: "Mohammed", title: "Staff Software Engineer", dept: "Engineering", state: "NY", city: "New York", hired: "2022-06-13", med: ["ppo500", "ES"], dental: "ES", vision: "ES", deps: [spouse("Omar Mohammed", "1991-02-17")] }),
  e({ id: "e06", first: "Wei", last: "Zhang", title: "Senior Software Engineer", dept: "Engineering", state: "NY", city: "New York", hired: "2022-09-06", med: ["ppo1500", "EE"], dental: "EE", vision: "EE" }),
  e({ id: "e07", first: "Andre", last: "Thompson", title: "Senior Software Engineer", dept: "Engineering", state: "TX", city: "Dallas", hired: "2023-03-20", med: ["ppo1500", "EC"], dental: "EC", vision: "EC", deps: [child("Jalen Thompson", "2014-07-09"), child("Kiara Thompson", "2017-01-25")], prior: [{ until: "2026-03-31", medical: "FAM", dental: "FAM", vision: "FAM" }] }),
  e({ id: "e08", first: "Sofia", last: "Petrov", title: "Software Engineer", dept: "Engineering", state: "NY", city: "New York", hired: "2023-05-15", med: ["hdhp3000", "EE"], dental: "EE", vision: "EE" }),
  e({ id: "e09", first: "Liam", last: "O'Connor", title: "Platform Engineer", dept: "Engineering", state: "MA", city: "Boston", hired: "2023-02-06", med: ["ppo1500", "ES"], dental: "ES", deps: [spouse("Erin O'Connor", "1990-10-30")] }),
  e({ id: "e10", first: "Mei", last: "Tanaka", title: "Senior Frontend Engineer", dept: "Engineering", state: "CA", city: "Oakland", hired: "2023-08-21", med: ["ppo500", "EE"], dental: "EE", vision: "EE" }),
  e({ id: "e11", first: "Diego", last: "Hernández", title: "Software Engineer", dept: "Engineering", state: "NY", city: "New York", hired: "2024-01-08", med: ["hdhp3000", "EE"], dental: "EE", vision: "EE" }),
  e({ id: "e12", first: "Kwame", last: "Asante", title: "Staff Engineer", dept: "Engineering", state: "NJ", city: "Montclair", hired: "2022-11-14", med: ["ppo500", "FAM"], dental: "FAM", vision: "FAM", deps: [spouse("Abena Asante", "1987-03-12"), child("Ama Asante", "2016-05-30"), child("Yaw Asante", "2019-12-11")] }),
  e({ id: "e13", first: "Hannah", last: "Goldberg", title: "Engineering Manager", dept: "Engineering", state: "NY", city: "New York", hired: "2022-08-01", med: ["ppo1500", "EC"], dental: "EC", vision: "EC", deps: [child("Leo Goldberg", "2018-09-04")] }),
  e({ id: "e14", first: "Ryan", last: "Mitchell", title: "DevOps Engineer", dept: "Engineering", state: "CO", city: "Denver", hired: "2024-04-15", med: ["hdhp3000", "EE"], dental: "EE", vision: "EE" }),
  e({ id: "e15", first: "Fatima", last: "Al-Sayed", title: "Data Engineer", dept: "Engineering", state: "IL", city: "Chicago", hired: "2024-02-26", med: ["ppo1500", "EE"], dental: "EE", vision: "EE" }),
  e({ id: "e16", first: "Ethan", last: "Walsh", title: "Software Engineer", dept: "Engineering", state: "NY", city: "Brooklyn", hired: "2024-06-03", med: ["hdhp3000", "EE"], dental: "EE" }),
  e({ id: "e17", first: "Nadia", last: "Rahman", title: "Security Engineer", dept: "Engineering", state: "NY", city: "New York", hired: "2024-03-11", med: ["ppo1500", "ES"], dental: "ES", vision: "ES", deps: [spouse("Arif Rahman", "1989-06-22")] }),
  e({ id: "e18", first: "Lucas", last: "Ferreira", title: "Mobile Engineer", dept: "Engineering", state: "CA", city: "Los Angeles", hired: "2024-09-09", med: ["ppo1500", "EE"], dental: "EE", vision: "EE" }),
  e({ id: "e19", first: "Chloe", last: "Martin", title: "QA Engineer", dept: "Engineering", state: "NJ", city: "Hoboken", hired: "2025-01-13", med: ["hdhp3000", "EE"], dental: "EE", vision: "EE" }),
  e({ id: "e20", first: "Arjun", last: "Mehta", title: "Machine Learning Engineer", dept: "Engineering", state: "CA", city: "San Francisco", hired: "2025-03-03", med: ["ppo500", "ES"], dental: "ES", vision: "ES", deps: [spouse("Kavya Mehta", "1994-08-19")] }),
  e({ id: "e21", first: "Samuel", last: "Osei", title: "Backend Engineer", dept: "Engineering", state: "NY", city: "New York", hired: "2025-05-19", waived: true, dental: "EE", vision: "EE" }),
  e({ id: "e22", first: "Tara", last: "Nguyen", title: "Software Engineer", dept: "Engineering", state: "WA", city: "Seattle", hired: "2025-08-11", med: ["ppo1500", "EE"], dental: "EE", vision: "EE" }),
  e({ id: "e23", first: "Jonah", last: "Levi", title: "Senior Software Engineer", dept: "Engineering", state: "NY", city: "New York", hired: "2025-10-06", med: ["hdhp3000", "ES"], dental: "ES", vision: "ES", deps: [spouse("Talia Levi", "1993-04-08")] }),
  e({ id: "e24", first: "Yusuf", last: "Demir", title: "Software Engineer", dept: "Engineering", state: "TX", city: "Austin", hired: "2026-04-06", med: ["ppo1500", "EE"], dental: "EE", vision: "EE" }),
  // New hire, waiting period: eligible Jul 1.
  e({ id: "e25", first: "Mateo", last: "Rossi", title: "Software Engineer", dept: "Engineering", state: "NY", city: "New York", hired: "2026-06-05" }),

  // ── Product / Design ─────────────────────────────────────────
  // Story: first Oregon employee. Dental deducted in payroll but missing from Brightline invoice.
  e({ id: "e26", first: "Elena", last: "Vasquez", title: "Product Designer", dept: "Product/Design", state: "OR", city: "Portland", hired: "2026-06-01", med: ["ppo1500", "EE"], dental: "EE", vision: "EE" }),
  e({ id: "e27", first: "Inês", last: "Duarte", title: "Visual Designer (Part-time)", dept: "Product/Design", state: "NY", city: "New York", hired: "2025-02-03", hours: [22, 22, 21, 23, 24, 23] }),
  // New hire, waiting period: eligible Jul 1.
  e({ id: "e28", first: "Zoe", last: "Chen", title: "Product Manager", dept: "Product/Design", state: "NY", city: "New York", hired: "2026-06-13" }),
  e({ id: "e29", first: "Gabriel", last: "Silva", title: "Director of Product", dept: "Product/Design", state: "NY", city: "New York", hired: "2022-05-02", med: ["ppo500", "FAM"], dental: "FAM", vision: "FAM", deps: [spouse("Renata Silva", "1985-09-15"), child("Bia Silva", "2015-02-08")] }),
  e({ id: "e30", first: "Maya", last: "Patel", title: "Senior Product Designer", dept: "Product/Design", state: "CA", city: "San Diego", hired: "2023-10-02", med: ["ppo1500", "EE"], dental: "EE", vision: "EE" }),
  e({ id: "e31", first: "Ella", last: "Johansson", title: "Product Manager", dept: "Product/Design", state: "MA", city: "Cambridge", hired: "2024-07-22", med: ["hdhp3000", "EE"], dental: "EE", vision: "EE" }),
  // Completed life event: married Apr 15, 2026, spouse added May 1.
  e({ id: "e32", first: "Kenji", last: "Watanabe", title: "UX Researcher", dept: "Product/Design", state: "NY", city: "New York", hired: "2024-11-04", med: ["ppo1500", "ES"], dental: "ES", vision: "ES", deps: [spouse("Hana Watanabe", "1995-03-27", "2026-05-01")], prior: [{ until: "2026-04-30", medical: "EE", dental: "EE", vision: "EE" }] }),

  // ── Sales ────────────────────────────────────────────────────
  // Story: payroll deducts EE+Child since March; Meridian still bills EE-only (underbilled).
  e({ id: "e33", first: "Greg", last: "Novak", title: "Sales Engineer", dept: "Sales", state: "CO", city: "Denver", hired: "2023-06-05", med: ["ppo1500", "EC"], dental: "EC", vision: "EE", deps: [child("Lily Novak", "2015-03-04", "2026-03-01")], prior: [{ until: "2026-02-28", medical: "EE", dental: "EE" }] }),
  e({ id: "e34", first: "Caleb", last: "Ross", title: "Sales Development Rep (Part-time)", dept: "Sales", state: "CO", city: "Boulder", hired: "2025-06-16", hours: [19, 20, 20, 21, 22, 21] }),
  e({ id: "e35", first: "Brianna", last: "Lewis", title: "Account Executive", dept: "Sales", state: "NY", city: "New York", hired: "2023-09-18", med: ["ppo1500", "EE"], dental: "EE", vision: "EE" }),
  e({ id: "e36", first: "Victor", last: "Alvarez", title: "Account Executive", dept: "Sales", state: "TX", city: "Houston", hired: "2024-05-06", med: ["ppo500", "FAM"], dental: "FAM", vision: "FAM", deps: [spouse("Carmen Alvarez", "1986-12-01"), child("Sebastián Alvarez", "2012-10-17"), child("Valeria Alvarez", "2016-04-04")] }),
  e({ id: "e37", first: "Jasmine", last: "Wright", title: "Account Executive", dept: "Sales", state: "NJ", city: "Jersey City", hired: "2024-08-12", med: ["hdhp3000", "EE"], dental: "EE", vision: "EE" }),
  e({ id: "e38", first: "Patrick", last: "Doyle", title: "Sales Manager", dept: "Sales", state: "MA", city: "Boston", hired: "2023-04-10", med: ["ppo1500", "ES"], dental: "ES", vision: "ES", deps: [spouse("Siobhan Doyle", "1984-07-07")] }),
  e({ id: "e39", first: "Rosa", last: "Jiménez", title: "Account Executive", dept: "Sales", state: "CA", city: "Los Angeles", hired: "2025-04-07", med: ["hdhp3000", "EE"], dental: "EE" }),
  e({ id: "e40", first: "Devin", last: "Park", title: "Sales Development Rep", dept: "Sales", state: "NY", city: "New York", hired: "2025-09-02", med: ["ppo1500", "EE"], dental: "EE", vision: "EE" }),

  // ── Customer Success ─────────────────────────────────────────
  // Story: part-time, trending above 30 hrs/week.
  e({ id: "e41", first: "Sam", last: "Whitaker", title: "Support Specialist (Part-time)", dept: "Customer Success", state: "TX", city: "Austin", hired: "2025-03-17", hours: [26, 27, 29, 30.5, 31, 32] }),
  e({ id: "e42", first: "Leah", last: "Cohen", title: "Customer Success Lead", dept: "Customer Success", state: "NY", city: "New York", hired: "2023-07-10", med: ["ppo1500", "ES"], dental: "ES", vision: "ES", deps: [spouse("David Cohen", "1988-01-29")] }),
  e({ id: "e43", first: "Marisol", last: "Ortiz", title: "Customer Success Manager", dept: "Customer Success", state: "IL", city: "Chicago", hired: "2024-10-14", med: ["ppo1500", "EC"], dental: "EC", vision: "EC", deps: [child("Ana Ortiz", "2020-06-12")] }),
  e({ id: "e44", first: "Tyrone", last: "Jackson", title: "Implementation Specialist", dept: "Customer Success", state: "NY", city: "New York", hired: "2025-07-07", med: ["hdhp3000", "EE"], dental: "EE", vision: "EE" }),
  e({ id: "e45", first: "Nina", last: "Kowalski", title: "Customer Success Manager", dept: "Customer Success", state: "WA", city: "Seattle", hired: "2026-03-13", med: ["ppo1500", "EE"], dental: "EE", vision: "EE" }),

  // ── Ops / Finance / People ───────────────────────────────────
  e({ id: "e46", first: "Dana", last: "Okafor", title: "Head of People", dept: "Ops/Finance/People", state: "NY", city: "New York", hired: "2023-02-13", med: ["ppo1500", "EE"], dental: "EE", vision: "EE" }),
  e({ id: "e47", first: "Ben", last: "Adler", title: "Controller", dept: "Ops/Finance/People", state: "NJ", city: "Jersey City", hired: "2023-11-06", med: ["ppo500", "ES"], dental: "ES", vision: "ES", deps: [spouse("Miriam Adler", "1983-05-05")] }),
  e({ id: "e48", first: "Grace", last: "Liu", title: "Recruiting Coordinator (Part-time)", dept: "Ops/Finance/People", state: "NJ", city: "Hoboken", hired: "2025-05-05", hours: [22, 22, 24, 23, 25, 24] }),
  e({ id: "e49", first: "Kayla", last: "Johnson", title: "Finance Associate", dept: "Ops/Finance/People", state: "FL", city: "Miami", hired: "2024-12-02", med: ["hdhp3000", "EE"], dental: "EE", vision: "EE" }),
  e({ id: "e50", first: "Lucía", last: "Romero", title: "Operations Manager", dept: "Ops/Finance/People", state: "NY", city: "New York", hired: "2023-12-04", med: ["ppo1500", "FAM"], dental: "FAM", vision: "FAM", deps: [spouse("Andrés Romero", "1987-08-08"), child("Camila Romero", "2019-03-03")] }),

  // ── Terminated in 2026 ───────────────────────────────────────
  // Story: terminated Apr 28; still billed by Meridian and Brightline for May + Jun.
  e({ id: "t01", first: "Marcus", last: "Bell", title: "Account Executive", dept: "Sales", state: "NY", city: "New York", hired: "2023-03-06", terminated: "2026-04-28", med: ["ppo1500", "ES"], dental: "ES", vision: "ES", deps: [spouse("Tanya Bell", "1990-02-11")] }),
  // Story: terminated May 31; COBRA election notice not yet sent (due Jul 14).
  e({ id: "t02", first: "Priya", last: "Raman", title: "Senior Software Engineer", dept: "Engineering", state: "NJ", city: "Edison", hired: "2022-10-03", terminated: "2026-05-31", med: ["ppo500", "FAM"], dental: "FAM", vision: "FAM", deps: [spouse("Vikram Raman", "1986-11-20"), child("Anika Raman", "2017-08-14"), child("Rohan Raman", "2021-02-02")] }),
  e({ id: "t03", first: "Tyler", last: "Brooks", title: "Account Executive", dept: "Sales", state: "NY", city: "New York", hired: "2024-01-22", terminated: "2026-02-13", med: ["ppo1500", "ES"], dental: "ES", vision: "ES", deps: [spouse("Megan Brooks", "1992-09-09")] }),
  e({ id: "t04", first: "Rebecca", last: "Stone", title: "Account Executive", dept: "Sales", state: "NY", city: "New York", hired: "2024-04-01", terminated: "2026-03-20", med: ["hdhp3000", "EE"], dental: "EE", vision: "EE" }),
  e({ id: "t05", first: "Kofi", last: "Mensah", title: "Software Engineer", dept: "Engineering", state: "NY", city: "New York", hired: "2023-10-16", terminated: "2026-05-08", med: ["ppo1500", "EE"], dental: "EE", vision: "EE" }),
  e({ id: "t06", first: "Olivia", last: "Grant", title: "Customer Success Manager", dept: "Customer Success", state: "IL", city: "Chicago", hired: "2024-03-04", terminated: "2026-03-12", med: ["hdhp3000", "EE"], dental: "EE", vision: "EE" }),
  e({ id: "t07", first: "Lauren", last: "Price", title: "Product Designer", dept: "Product/Design", state: "CA", city: "San Francisco", hired: "2024-05-13", terminated: "2026-04-24", med: ["ppo1500", "EE"], dental: "EE", vision: "EE" }),
];

export const employeeById: Record<string, Employee> = Object.fromEntries(employees.map((x) => [x.id, x]));

export function fullName(emp: Employee) {
  return `${emp.firstName} ${emp.lastName}`;
}

export function initials(emp: Employee) {
  return `${emp.firstName[0]}${emp.lastName[0]}`;
}

/** Ids for the story employees, so other modules can reference them by role. */
export const STORY = {
  marcus: "t01",
  priya: "t02",
  jordan: "e04",
  aisha: "e05",
  elena: "e26",
  sam: "e41",
  greg: "e33",
  mateo: "e25",
  zoe: "e28",
  kenji: "e32",
  tyler: "t03",
  olivia: "t06",
  andre: "e07",
} as const;
