import { App } from "@slack/bolt";
import { buildNudge } from "./nudge";

// Posts the proactive Keel nudge to the HR admin. Run while `npm run slack` is up so the buttons work.
// Usage: npm run slack:nudge   (needs DEMO_SLACK_USER_ID or DEMO_SLACK_CHANNEL in .env.local)

const target = process.env.DEMO_SLACK_USER_ID || process.env.DEMO_SLACK_CHANNEL;
const msg = buildNudge("pending");

if (process.argv.includes("--dry")) {
  console.log(JSON.stringify(msg, null, 2));
} else if (!target) {
  console.error("Set DEMO_SLACK_USER_ID (your Slack member ID) or DEMO_SLACK_CHANNEL in .env.local");
  process.exit(1);
} else {
  const app = new App({ token: process.env.SLACK_BOT_TOKEN, appToken: process.env.SLACK_APP_TOKEN, socketMode: true });
  app.client.chat
    .postMessage({ channel: target, ...msg })
    .then((r) => { console.log(`Posted nudge to ${target} (ts ${r.ts})`); process.exit(0); })
    .catch((e) => {
      console.error(e.data?.error ?? e);
      process.exit(1);
    });
}
