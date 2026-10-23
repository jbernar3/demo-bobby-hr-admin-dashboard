import { App } from "@slack/bolt";
import type { WebClient } from "@slack/web-api";
import type { KnownBlock } from "@slack/types";
import { answerFor, ASK_QUESTIONS, FALLBACK_TEXT, matchQuestion } from "@/data/askKeel";
import { platform } from "@/data/company";
import type { DemoState } from "@/lib/store";
import type { AnswerBlock } from "@/lib/types";
import { buildNudge, buildPreviewAll } from "./nudge";

// Slack front-end for the scripted Ask Keel answers. Runs over Socket Mode, so no public URL is needed.
// Usage: npm run slack  (needs SLACK_BOT_TOKEN and SLACK_APP_TOKEN in .env.local)

const DASHBOARD_URL = (process.env.DASHBOARD_URL ?? "http://localhost:3000").replace(/\/$/, "");
const THINK_MS = Number(process.env.KEEL_THINK_MS ?? 1500);

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true,
});

// Approvals made in Slack carry into later answers, like the dashboard's done state.
const done: DemoState["done"] = {};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Emoji shown on the user's message while Keel "thinks". Needs the reactions:write scope.
const THINKING_EMOJI = process.env.KEEL_THINK_EMOJI ?? "eyes";
let warnedReactions = false;

async function react(client: WebClient, channel: string, timestamp: string, add: boolean) {
  try {
    if (add) await client.reactions.add({ channel, timestamp, name: THINKING_EMOJI });
    else await client.reactions.remove({ channel, timestamp, name: THINKING_EMOJI });
  } catch (e) {
    const err = (e as { data?: { error?: string } }).data?.error;
    if (err === "missing_scope" && !warnedReactions) {
      warnedReactions = true;
      console.warn("Can't add the thinking reaction: add the reactions:write scope to the Slack app and reinstall it.");
    }
  }
}

function renderTable(columns: string[], rows: string[][]): string {
  const widths = columns.map((c, i) => Math.max(c.length, ...rows.map((r) => (r[i] ?? "").length)));
  const line = (cells: string[]) => cells.map((c, i) => c.padEnd(widths[i])).join("  ").trimEnd();
  return "```" + [line(columns), widths.map((w) => "─".repeat(w)).join("  "), ...rows.map(line)].join("\n") + "```";
}

function toBlocks(answer: AnswerBlock[]): KnownBlock[] {
  const out: KnownBlock[] = [];
  for (const b of answer) {
    switch (b.type) {
      case "text":
        out.push({ type: "section", text: { type: "mrkdwn", text: b.text } });
        break;
      case "stat":
        out.push({ type: "section", text: { type: "mrkdwn", text: `*${b.value}*\n${b.label}` } });
        break;
      case "table":
        out.push({ type: "section", text: { type: "mrkdwn", text: renderTable(b.columns, b.rows) } });
        break;
      case "action": {
        const id = b.actionId ?? b.href ?? b.label;
        out.push({
          type: "actions",
          elements: [
            {
              type: "button",
              text: { type: "plain_text", text: b.label.slice(0, 75) },
              style: b.actionId ? "primary" : undefined,
              action_id: b.actionId ? `approve:${b.actionId}` : `link:${id}`,
              value: b.actionId,
              url: b.href ? `${DASHBOARD_URL}${b.href}` : undefined,
            },
          ],
        });
        break;
      }
    }
  }
  return out;
}

function reply(text: string): { text: string; blocks: KnownBlock[] } {
  const id = matchQuestion(text);
  if (!id) {
    const suggestions = ASK_QUESTIONS.map((q) => `• ${q.question}`).join("\n");
    return {
      text: FALLBACK_TEXT,
      blocks: [
        { type: "section", text: { type: "mrkdwn", text: FALLBACK_TEXT } },
        { type: "section", text: { type: "mrkdwn", text: `*Try asking:*\n${suggestions}` } },
      ],
    };
  }
  const blocks = toBlocks(answerFor(id, done));
  return { text: ASK_QUESTIONS.find((q) => q.id === id)?.question ?? platform.name, blocks };
}

app.event("app_mention", async ({ event, client }) => {
  const question = event.text.replace(/<@[^>]+>/g, "").trim();
  const thread_ts = event.thread_ts ?? event.ts;
  await react(client, event.channel, event.ts, true);
  await sleep(THINK_MS);
  await client.chat.postMessage({ channel: event.channel, thread_ts, ...reply(question) });
  await react(client, event.channel, event.ts, false);
});

app.message(async ({ message, client }) => {
  if (message.channel_type !== "im" || message.subtype || !("text" in message) || !message.text) return;
  await react(client, message.channel, message.ts, true);
  await sleep(THINK_MS);
  await client.chat.postMessage({ channel: message.channel, ...reply(message.text) });
  await react(client, message.channel, message.ts, false);
});

app.action(/^approve:/, async ({ ack, action, body, client }) => {
  await ack();
  if (action.type !== "button" || !action.value || body.type !== "block_actions") return;
  done[action.value] = { at: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }), seq: Object.keys(done).length };
  const msg = body.message;
  const channel = body.channel?.id;
  if (!msg || !channel) return;
  // Swap the approve button for a confirmation line.
  const blocks = (msg.blocks as KnownBlock[]).map((b) =>
    b.type === "actions" && b.elements.some((e) => (e as { action_id?: string }).action_id === (action as { action_id: string }).action_id)
      ? ({ type: "context", elements: [{ type: "mrkdwn", text: `:white_check_mark: Approved by <@${body.user.id}>. ${platform.name} is on it.` }] } as KnownBlock)
      : b,
  );
  await client.chat.update({ channel, ts: msg.ts, text: msg.text ?? platform.name, blocks });
});

// Proactive enrollment nudge: sent by `npm run slack:nudge`, approved here.
app.action("nudge:send", async ({ ack, body, client }) => {
  await ack();
  if (body.type !== "block_actions" || !body.message || !body.channel) return;
  const { channel, message } = { channel: body.channel.id, message: body.message };
  await client.chat.update({ channel, ts: message.ts, ...buildNudge("sending") });
  await sleep(1800);
  await client.chat.update({ channel, ts: message.ts, ...buildNudge("sent", body.user.id) });
});

app.action("nudge:snooze", async ({ ack, body, client }) => {
  await ack();
  if (body.type !== "block_actions" || !body.message || !body.channel) return;
  await client.chat.update({ channel: body.channel.id, ts: body.message.ts, ...buildNudge("snoozed") });
});

app.action("nudge:preview", async ({ ack, body, client }) => {
  await ack();
  if (body.type !== "block_actions" || !body.message || !body.channel) return;
  await client.chat.postMessage({ channel: body.channel.id, thread_ts: body.message.ts, ...buildPreviewAll() });
});

// Link buttons still fire an interaction event; just acknowledge it.
app.action(/^link:/, async ({ ack }) => ack());

(async () => {
  await app.start();
  console.log(`⚡ ${platform.name} Slack bot running (Socket Mode)`);
})();
