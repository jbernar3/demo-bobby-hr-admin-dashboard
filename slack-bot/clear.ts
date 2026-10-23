import { WebClient } from "@slack/web-api";
import { platform } from "@/data/company";

// Deletes every message Keel posted (including thread replies) in your DM with it, or in DEMO_SLACK_CHANNEL.
// Slack only lets a bot delete its own messages, so your own questions have to be removed by hand.
// Usage: npm run slack:clear

const token = process.env.SLACK_BOT_TOKEN;
const userId = process.env.DEMO_SLACK_USER_ID;
const channelEnv = process.env.DEMO_SLACK_CHANNEL;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  if (!token || (!userId && !channelEnv)) {
    console.error("Set SLACK_BOT_TOKEN and DEMO_SLACK_USER_ID (or DEMO_SLACK_CHANNEL) in .env.local");
    process.exit(1);
  }
  const client = new WebClient(token);
  const { user_id: botUserId } = await client.auth.test();

  const channel = channelEnv && !userId ? channelEnv : (await client.conversations.open({ users: userId! })).channel?.id;
  if (!channel) throw new Error("Could not open the conversation");

  const ours = (m: { user?: string; bot_id?: string }) => m.user === botUserId || !!m.bot_id;
  const targets: string[] = [];

  let cursor: string | undefined;
  do {
    const res = await client.conversations.history({ channel, limit: 200, cursor });
    for (const m of res.messages ?? []) {
      if (m.ts && ours(m)) targets.push(m.ts);
      if (m.ts && (m.reply_count ?? 0) > 0) {
        const replies = await client.conversations.replies({ channel, ts: m.ts, limit: 200 });
        for (const r of replies.messages ?? []) if (r.ts && r.ts !== m.ts && ours(r)) targets.push(r.ts);
      }
    }
    cursor = res.response_metadata?.next_cursor || undefined;
  } while (cursor);

  console.log(`Deleting ${targets.length} ${platform.name} message(s)…`);
  let deleted = 0;
  for (const ts of targets) {
    try {
      await client.chat.delete({ channel, ts });
      deleted++;
    } catch (e) {
      console.warn(`Skipped ${ts}: ${(e as { data?: { error?: string } }).data?.error ?? e}`);
    }
    await sleep(250);
  }
  console.log(`Done. Deleted ${deleted}/${targets.length}. Delete your own messages by hand (hover > ⋮ > Delete message).`);
}

main().catch((e) => {
  console.error(e.data?.error ?? e);
  process.exit(1);
});
