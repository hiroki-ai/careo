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

  const prompt = `Create a modern, clean blog thumbnail illustration for a Japanese job hunting (就活) article.

Title: "${title}"
Tag: "${tag}"

Requirements:
- Modern flat illustration style, NOT photorealistic
- Relevant to the topic (e.g., for "ES対策" show documents/writing, for "面接対策" show interview scene)
- Include a small cute penguin character wearing a green tie somewhere in the illustration
- Color palette: primarily use emerald green (#00c896), dark navy (#0d1b2e), white, with accent colors
- Clean, professional look suitable for a career-focused blog
- No text in the image (text will be overlaid separately)
- 16:9 aspect ratio composition
- Minimalist Japanese illustration style
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
