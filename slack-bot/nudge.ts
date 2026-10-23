import type { KnownBlock } from "@slack/types";
import { advisor, openEnrollment, platform, user } from "@/data/company";
import { employeeById, fullName } from "@/data/employees";
import { fmtShort } from "@/lib/dates";

// Proactive "Keel nudge": a pending-enrollment check that asks the HR admin to approve reminders.

const DASHBOARD_URL = (process.env.DASHBOARD_URL ?? "http://localhost:3000").replace(/\/$/, "");

// Scripted: in the demo nobody has started open enrollment yet, so these five are the stragglers.
export const STRAGGLER_IDS = ["e06", "e07", "e08", "e09", "e10"];
const stragglers = STRAGGLER_IDS.map((id) => employeeById[id]);

export type NudgeState = "pending" | "sending" | "sent" | "snoozed";

export function reminderFor(first: string): string {
  return `Hi ${first},

Quick reminder that 2027 open enrollment runs ${fmtShort(openEnrollment.start)} to ${fmtShort(openEnrollment.end)}, and I don't see a plan pick from you yet.

It takes about 5 minutes:
1. Compare the three Meridian medical plans (PPO 500, PPO 1500, HDHP 3000 + HSA)
2. Check your dependents and your dental and vision elections
3. Confirm in ${platform.name}

If you're not sure what fits, you can book 15 minutes with ${advisor.name}, our benefits advisor. Just reply here with any questions.

Thanks,
${user.firstName}`;
}

const quote = (text: string) => text.split("\n").map((l) => `> ${l}`).join("\n");

export function buildNudge(state: NudgeState, approver?: string): { text: string; blocks: KnownBlock[] } {
  const n = stragglers.length;
  const text = `Reminder: ${n} employees haven't picked a 2027 plan. Want me to send each a reminder?`;
  const blocks: KnownBlock[] = [
    { type: "header", text: { type: "plain_text", text: `Reminder: ${n} employees haven't picked a 2027 plan` } },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `Hi ${user.firstName}, plan decision support has been open since ${fmtShort(openEnrollment.decisionSupportOpened)} and the enrollment window opens *${fmtShort(openEnrollment.start)}* (closes ${fmtShort(openEnrollment.end)}). ${n} people haven't started yet. Do you want me to send each of them a reminder? I'd send it as a Slack DM from you, so replies come straight to you.`,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: stragglers
          .map((e) => `${state === "sent" ? ":white_check_mark:" : ":white_circle:"}  *${fullName(e)}*  ·  ${e.title}  ·  ${state === "sent" ? "Reminder sent" : "Not started"}`)
          .join("\n"),
      },
    },
    { type: "divider" },
    { type: "section", text: { type: "mrkdwn", text: `*Draft message*  _sent as a DM on your behalf, personalized with each person's first name_\n${quote(reminderFor(stragglers[0].firstName))}` } },
  ];

  if (state === "pending") {
    blocks.push({
      type: "actions",
      elements: [
        { type: "button", style: "primary", text: { type: "plain_text", text: `Send ${n} reminders` }, action_id: "nudge:send" },
        { type: "button", text: { type: "plain_text", text: "Preview all messages" }, action_id: "nudge:preview" },
        { type: "button", text: { type: "plain_text", text: "Remind me tomorrow" }, action_id: "nudge:snooze" },
        { type: "button", text: { type: "plain_text", text: `Open in ${platform.name}` }, url: `${DASHBOARD_URL}/enrollment`, action_id: "link:nudge-open" },
      ],
    });
  } else {
    const line =
      state === "sending"
        ? `:hourglass_flowing_sand: Sending ${n} reminders…`
        : state === "sent"
          ? `:white_check_mark: *Approved by <@${approver}>.* Sent ${n} reminders. I'll follow up with anyone who hasn't started by ${fmtShort(openEnrollment.start)}.`
          : `:zzz: Snoozed. I'll check again tomorrow morning.`;
    blocks.push({ type: "context", elements: [{ type: "mrkdwn", text: line }] });
  }

  blocks.push({ type: "context", elements: [{ type: "mrkdwn", text: `${platform.name} · Nothing is sent without your approval` }] });
  return { text, blocks };
}

export function buildPreviewAll(): { text: string; blocks: KnownBlock[] } {
  return {
    text: "Reminder previews",
    blocks: stragglers.map((e) => ({
      type: "section" as const,
      text: { type: "mrkdwn" as const, text: `*To ${fullName(e)}* (${e.email})\n${quote(reminderFor(e.firstName))}` },
    })),
  };
}
