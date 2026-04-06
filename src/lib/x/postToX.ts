import { TwitterApi } from "twitter-api-v2";

function getClient(): TwitterApi {
  const apiKey = process.env.X_API_KEY;
  const apiSecret = process.env.X_API_SECRET;
  const accessToken = process.env.X_ACCESS_TOKEN;
  const accessSecret = process.env.X_ACCESS_SECRET;

  if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
    throw new Error("X API credentials are not set");
  }

  return new TwitterApi({ appKey: apiKey, appSecret: apiSecret, accessToken, accessSecret });
}

export async function postToX(text: string): Promise<{ id: string; url: string }> {
  const client = getClient();
  const tweet = await client.v2.tweet(text);
  const id = tweet.data.id;
  const url = `https://x.com/i/web/status/${id}`;
  return { id, url };
}
