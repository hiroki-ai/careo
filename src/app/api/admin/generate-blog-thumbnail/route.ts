import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

/**
 * Generate a blog thumbnail using Gemini image generation,
 * upload to Supabase Storage, and update the blog_posts record.
 *
 * Can be called standalone (POST with { slug }) or as a helper function.
 */

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const secret = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await req.json();
  if (!slug) {
    return NextResponse.json({ error: "slug is required" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch the blog post
  const { data: post, error: fetchError } = await supabase
    .from("blog_posts")
    .select("id, title, tags")
    .eq("slug", slug)
    .single();

  if (fetchError || !post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  try {
    const thumbnailUrl = await generateAndUploadThumbnail(
      supabase,
      slug,
      post.title,
      post.tags?.[0] ?? "就活"
    );

    return NextResponse.json({ ok: true, slug, thumbnail_url: thumbnailUrl });
  } catch (err) {
    console.error("Thumbnail generation failed:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Generate a thumbnail with Gemini, upload to Supabase Storage,
 * and update the blog_posts record. Returns the public URL.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function generateAndUploadThumbnail(
  supabase: any,
  slug: string,
  title: string,
  tag: string
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp",
    generationConfig: {
      responseModalities: ["IMAGE", "TEXT"],
    } as Record<string, unknown>,
  });

  const prompt = `You are a senior editorial illustrator for a Japanese career-tech media brand "Careo" targeting university students (28卒). Create a premium blog thumbnail illustration.

ARTICLE CONTEXT
- Title: "${title}"
- Primary topic tag: "${tag}"

VISUAL DIRECTION (critical)
- Style: refined editorial flat illustration; Japanese Webtoon-adjacent aesthetic; clean vector-like lines; soft grain/paper texture OK; absolutely NOT 3D, NOT photorealistic, NOT AI-looking generic stock art
- Composition: 16:9 horizontal, clear focal point on the left 2/3, breathing room on the right for potential text overlay (do NOT draw text — text will be overlaid separately)
- Subject: visually represent the article topic literally and specifically. Examples:
  * ES/自己PR/ガクチカ → a desk scene with a laptop + handwritten notebook + a cup of coffee; light coming from a window
  * 面接対策/逆質問 → an interview meeting scene from a calm angle, soft focus, no threatening mood
  * インターン/選考スケジュール → a calendar or timeline on a wall with sticky notes
  * 業界研究/企業分析 → bookshelves, magnifying glass over a document, stylized company buildings silhouette
  * 自己分析/軸づくり → a person looking at a mirror of graphs; a journey path or compass
- Mascot (MANDATORY): include a small mint-green bean-shaped character called "Careo-kun" somewhere in the scene — shape is a rounded vertical oval bean, mint green (#00c896) body with a soft lighter-green face, tiny black dot eyes, a subtle small smile. Keep it simple and cute, NOT cartoonish, NOT a penguin, NOT a mascot with limbs or clothing. It should feel like a friendly supporting character, not the main subject.

COLOR PALETTE (strict)
- Primary accent: #00c896 (Careo mint green) and #00a87e (deep teal)
- Ink/text-like elements: #0D0B21
- Background/paper: warm off-white #fcfbf8 or beige #f5f3ee
- Allowed accent hues only when meaningful: soft amber (#f59e0b tints), soft blue (#60a5fa tints), muted rose for warmth. Avoid bright neon, avoid pure black.

QUALITY BAR
- Treat this like a cover for a high-end media company. Every element should have editorial intent.
- Avoid clichés: no laptops with fake code screens, no random confetti, no generic briefcase-suit businessmen, no American-style office.
- Texture: a faint paper grain is welcome. Harsh digital gradients are not.
- The mascot must not dominate the frame. The topic is the hero, the mascot is a supportive grace note.
- No text, no logos, no watermarks, no signatures in the image.
`;

  const result = await model.generateContent(prompt);
  const response = result.response;

  // Extract image data from response
  let imageData: string | null = null;
  let mimeType = "image/png";

  for (const candidate of response.candidates ?? []) {
    for (const part of candidate.content?.parts ?? []) {
      if (
        "inlineData" in part &&
        part.inlineData?.mimeType?.startsWith("image/")
      ) {
        imageData = part.inlineData.data ?? null;
        mimeType = part.inlineData.mimeType;
        break;
      }
    }
    if (imageData) break;
  }

  if (!imageData) {
    throw new Error("Gemini did not return an image");
  }

  // Convert base64 to buffer
  const buffer = Buffer.from(imageData, "base64");
  const ext = mimeType === "image/jpeg" ? "jpg" : mimeType === "image/webp" ? "webp" : "png";
  const filePath = `${slug}.${ext}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from("blog-thumbnails")
    .upload(filePath, buffer, {
      contentType: mimeType,
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Storage upload failed: ${uploadError.message}`);
  }

  // Get public URL
  const { data: publicUrlData } = supabase.storage
    .from("blog-thumbnails")
    .getPublicUrl(filePath);

  const thumbnailUrl = publicUrlData.publicUrl;

  // Update blog_posts record
  const { error: updateError } = await supabase
    .from("blog_posts")
    .update({ thumbnail_url: thumbnailUrl })
    .eq("slug", slug);

  if (updateError) {
    throw new Error(`DB update failed: ${updateError.message}`);
  }

  return thumbnailUrl;
}
