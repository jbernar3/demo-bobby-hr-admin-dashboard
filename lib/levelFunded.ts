import { claimsReportDate, largeClaimants, monthlyClaims2026 } from "@/data/claims";
import { levelFunded } from "@/data/plans";
import { carrierMonth, monthlyPremium } from "./billing";
import { CURRENT_MONTH, monthRange } from "./dates";

// Level-funded medical tracking: claims vs. the claims fund portion of premium.

const CLAIM_MONTHS = monthRange("2026-01", "2026-12").slice(0, monthlyClaims2026.length);

export function levelFundedSummary() {
  const months = CLAIM_MONTHS.map((ym, i) => {
    const premium = carrierMonth("medical", ym).invoice.amount;
    const fund = premium * levelFunded.claimsFundPct;
    return { month: ym, premium, fund, claims: monthlyClaims2026[i] };
  });
  const ytdClaims = months.reduce((s, m) => s + m.claims, 0);
  const ytdFund = months.reduce((s, m) => s + m.fund, 0);
  const ytdSurplus = ytdFund - ytdClaims;

  const currentPremium = carrierMonth("medical", CURRENT_MONTH).invoice.amount;
  const currentFund = currentPremium * levelFunded.claimsFundPct;
  const remaining = 12 - months.length;
  const mean = ytdClaims / months.length;
  const variance = months.reduce((s, m) => s + (m.claims - mean) ** 2, 0) / (months.length - 1);
  const sd = Math.sqrt(variance);
  const projected = ytdSurplus + remaining * (currentFund - mean);
  // ~80% range on the remaining months' claims.
  const spread = 1.28 * sd * Math.sqrt(remaining);
  const lossRatio = ytdClaims / ytdFund;

  const flagged = largeClaimants.filter((c) => c.paidToDate > levelFunded.specificDeductible * 0.5);
  const top = [...largeClaimants].sort((a, b) => b.paidToDate - a.paidToDate)[0];

  return {
    months,
    ytdClaims,
    ytdFund,
    ytdSurplus,
    lossRatio,
    currentPremium,
    currentFund,
    adminFee: currentPremium * levelFunded.adminFeePct,
    stopLoss: currentPremium * levelFunded.stopLossPct,
    projected,
    low: projected - spread,
    high: projected + spread,
    refundEstimate: Math.max(0, projected) * levelFunded.surplusRefundPct,
    flaggedCount: flagged.length,
    topPctOfDeductible: top ? top.paidToDate / levelFunded.specificDeductible : 0,
    reportDate: claimsReportDate,
  };
}

/** Monthly total benefits spend (all lines, invoiced), Jan → current month. */
export function spendTrend() {
  return monthRange("2026-01", CURRENT_MONTH).map((ym) => ({ month: ym, total: monthlyPremium(ym) }));
}
