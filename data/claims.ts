// De-identified, aggregate level-funded claims from Meridian's monthly report.
// No names, no conditions. Only totals and anonymized large-claim tracking.

/** Paid medical + Rx claims by month, Jan–Sep 2026. */
export const monthlyClaims2026: number[] = [33_100, 29_800, 36_400, 31_200, 47_900, 38_600, 30_400, 34_200, 32_700];

/** Anonymized claimants tracked against the stop-loss specific deductible. */
export const largeClaimants = [
  { label: "Claimant A", paidToDate: 31_400 },
  { label: "Claimant B", paidToDate: 14_200 },
  { label: "Claimant C", paidToDate: 9_800 },
];

export const claimsReportDate = "2026-10-12";
