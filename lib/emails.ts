import { advisor, company, user } from "@/data/company";
import { employeeById, fullName } from "@/data/employees";
import { carriers, TIER_LABEL } from "@/data/plans";
import { findingImpact, hrisTier, rateFor } from "./billing";
import { fmtDate, monthLabelLong } from "./dates";
import { money } from "./format";
import type { Finding } from "./types";

// Bobby-drafted carrier emails for billing findings.

export function carrierEmail(carrierId: Finding["carrierId"]) {
  return `billing@${carriers[carrierId].shortName.toLowerCase()}.example`;
}

export function draftEmail(f: Finding) {
  const emp = employeeById[f.employeeId];
  const carrier = carriers[f.carrierId];
  const name = fullName(emp);
  const amount = money(Math.abs(findingImpact(f)), { cents: true });
  const months = f.months.map(monthLabelLong).join(", ");
  const lines = f.months
    .map((ym) => {
      const correct = hrisTier(emp, f.line, ym);
      return `  • ${monthLabelLong(ym)}: billed ${f.billedTier ? TIER_LABEL[f.billedTier] : "not billed"} (${money(rateFor(emp, f.line, f.billedTier), { cents: true })}), ${correct ? `should be ${TIER_LABEL[correct]} (${money(rateFor(emp, f.line, correct), { cents: true })})` : "should not be billed"}`;
    })
    .join("\n");
  const sign = `Thanks,\nBobby, on behalf of ${user.name} (${user.title})\n${company.name} · Group benefits\ncc: ${advisor.name}, ${advisor.title}`;

  switch (f.type) {
    case "Ghost enrollee":
      return {
        subject: `Credit request: ${name}, terminated ${fmtDate(emp.terminationDate ?? "")}`,
        body: `Hi ${carrier.shortName} billing team,

${name} was terminated on ${fmtDate(emp.terminationDate ?? "")}, and coverage ended at the end of that month. ${company.shortName}'s invoices still include ${emp.firstName} for ${months}:

${lines}

Please remove ${emp.firstName} from the group effective the termination date and apply a credit of ${amount} to our next invoice. The termination record from our HRIS and final payroll register are attached.

${sign}`,
      };
    case "Tier mismatch":
      return {
        subject: `Tier correction + credit: ${name}`,
        body: `Hi ${carrier.shortName} billing team,

${name}'s coverage tier changed, but the invoice still reflects the old tier for ${months}:

${lines}

Please update ${emp.firstName}'s tier and apply a credit of ${amount} to our next invoice. Supporting dependent eligibility documentation is attached.

${sign}`,
      };
    case "Missing from invoice":
      return {
        subject: `Missing enrollment: ${name}, effective ${fmtDate(`${f.months[0]}-01`)}`,
        body: `Hi ${carrier.shortName} enrollment team,

${name} enrolled in ${carrier.line} effective ${fmtDate(`${f.months[0]}-01`)}, and payroll deductions began on schedule, but ${emp.firstName} does not appear on our ${months} invoice.

Please add ${emp.firstName} retroactive to the effective date and confirm that any claims incurred since then will be processed. We expect an adjustment of ${amount} per month on the next invoice. The enrollment form is attached.

${sign}`,
      };
    case "Underbilled":
      return {
        subject: `Tier update (we owe a balance): ${name}`,
        body: `Hi ${carrier.shortName} billing team,

${name} added a dependent effective ${fmtDate(`${f.months[0]}-01`)} and payroll has deducted the correct tier since then, but our invoices still bill the lower tier:

${lines}

Please update ${emp.firstName}'s tier retroactively and add the ${amount} balance to our next invoice so we can settle it in one payment. Enrollment documentation is attached.

${sign}`,
      };
  }
}
