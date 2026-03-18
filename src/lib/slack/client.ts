export async function postToSlack({
  text,
  username,
  icon_emoji,
  channel,
}: {
  text: string;
  username?: string;
  icon_emoji?: string;
  channel?: string;
}) {
  const res = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      channel: channel ?? process.env.SLACK_CHANNEL_ID,
      text,
      username,
      icon_emoji,
    }),
  });
  return res.json();
}
