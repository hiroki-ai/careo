import { TwitterApi } from "twitter-api-v2";

function getXClient() {
  const { X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRET } = process.env;

  if (!X_API_KEY || !X_API_SECRET || !X_ACCESS_TOKEN || !X_ACCESS_SECRET) {
    throw new Error("X API credentials are not set in environment variables");
  }

  return new TwitterApi({
    appKey: X_API_KEY,
    appSecret: X_API_SECRET,
    accessToken: X_ACCESS_TOKEN,
    accessSecret: X_ACCESS_SECRET,
  });
}

export interface PostResult {
  success: boolean;
  tweetId?: string;
  url?: string;
  error?: string;
}

export async function postToX(text: string): Promise<PostResult> {
  try {
    const client = getXClient();
    const rwClient = client.readWrite;
    const tweet = await rwClient.v2.tweet(text);

    const tweetId = tweet.data.id;
    return {
      success: true,
      tweetId,
      url: `https://x.com/i/web/status/${tweetId}`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[postToX] error:", message);
    return { success: false, error: message };
  }
}
