#!/usr/bin/env node
/**
 * Kareo penguin character image generator using Gemini API
 * Usage: GEMINI_API_KEY=xxx node scripts/generate-kareo.js [expression]
 * If no expression specified, generates all 8 + avatar
 */

const fs = require("fs");
const path = require("path");

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error("Error: GEMINI_API_KEY environment variable is required");
  process.exit(1);
}

const EXPRESSIONS = {
  default: "Neutral, friendly smile. Standing straight with flippers at sides. Looking directly at the viewer with warmth.",
  thinking: "One flipper on chin, head tilted slightly, looking upward with a curious/pondering expression. Small thought bubble dots (... ) floating above head.",
  celebrating: "Both flippers raised up high in celebration! Confetti or sparkles around. Big joyful smile with eyes squeezed shut in happiness. Party mood!",
  sad: "Slightly droopy posture, downturned beak corners, one small tear drop on cheek. Looking slightly down. Slumped shoulders.",
  encouraging: "One flipper giving a thumbs up gesture, confident wink with one eye closed, energetic upright pose. A small star sparkle near the flipper.",
  loading: "Running or walking forward with determined expression, slight forward lean. Motion lines behind. Busy/hustling pose.",
  error: "Surprised wide eyes, small sweat drop on forehead, holding up both flippers in a worried/apologetic gesture. An exclamation mark (!) floating nearby.",
  waving: "One flipper raised high and waving hello! Big cheerful open-mouth smile showing happiness. Friendly welcoming pose.",
};

const BASE_PROMPT = `Generate a cute kawaii penguin mascot character for a Japanese app. Follow these EXACT specifications:

Character design:
- Small adorable penguin, chibi proportions (big round head, small body)
- Body: Dark navy blue (#1a2744 to #2d3f5e), smooth gradient
- Belly: Bright white, oval shape
- Eyes: Large, round, expressive with white sparkle/highlight dots
- Beak: Small, yellow-orange (#f59e0b)
- Necktie: Emerald green (#00c896), straight tie hanging down from neck
- Cheeks: Soft pink/rosy circles
- Feet: Small orange/yellow feet

Art style:
- Modern kawaii Japanese mascot style (like LINE character stickers)
- Clean vector-like rendering with smooth edges
- Soft cel-shading with subtle highlights
- Pure white background (#ffffff), NO other objects or scenery
- Character fully visible, centered in frame
- High quality, professional mascot illustration
- Consistent character proportions across all expressions`;

async function generateImage(expression, description) {
  const prompt = `${BASE_PROMPT}\n\nExpression and pose: ${description}`;

  console.log(`  Generating ${expression}...`);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error (${response.status}): ${errorText.slice(0, 200)}`);
  }

  const data = await response.json();
  const parts = data.candidates?.[0]?.content?.parts || [];

  for (const part of parts) {
    if (part.inlineData?.mimeType?.startsWith("image/")) {
      return Buffer.from(part.inlineData.data, "base64");
    }
  }

  const textParts = parts.filter(p => p.text).map(p => p.text).join("\n");
  throw new Error(`No image in response. Text: ${textParts.slice(0, 200)}`);
}

async function generateAvatar() {
  const prompt = `${BASE_PROMPT}

Generate ONLY the head of this penguin character as a circular avatar icon:
- Just the head, neck, and top of tie visible
- Circular composition (head fills most of the frame)
- Face centered, looking straight at viewer
- Friendly default smile
- White background
- 1:1 square aspect ratio
- Suitable for a 40-80px avatar in a chat interface`;

  console.log("  Generating avatar...");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error (${response.status}): ${errorText.slice(0, 200)}`);
  }

  const data = await response.json();
  const parts = data.candidates?.[0]?.content?.parts || [];

  for (const part of parts) {
    if (part.inlineData?.mimeType?.startsWith("image/")) {
      return Buffer.from(part.inlineData.data, "base64");
    }
  }

  throw new Error("No image in avatar response");
}

async function main() {
  const targetExpression = process.argv[2];
  const outputDir = path.join(__dirname, "..", "public", "kareo");
  fs.mkdirSync(outputDir, { recursive: true });

  const expressionsToGenerate = targetExpression
    ? { [targetExpression]: EXPRESSIONS[targetExpression] }
    : EXPRESSIONS;

  if (targetExpression && !EXPRESSIONS[targetExpression] && targetExpression !== "avatar") {
    console.error(`Unknown expression: ${targetExpression}`);
    console.error(`Available: ${Object.keys(EXPRESSIONS).join(", ")}, avatar`);
    process.exit(1);
  }

  console.log("Kareo Character Generator (Gemini AI)");
  console.log("=====================================\n");

  let successCount = 0;
  let failCount = 0;

  // Generate expressions
  for (const [expr, desc] of Object.entries(expressionsToGenerate)) {
    try {
      const buffer = await generateImage(expr, desc);
      const filename = `kareo-${expr}.png`;
      const filepath = path.join(outputDir, filename);
      fs.writeFileSync(filepath, buffer);
      const sizeKB = (buffer.length / 1024).toFixed(1);
      console.log(`  ✓ ${filename} (${sizeKB} KB)`);
      successCount++;

      // Gemini rate limit: small delay between requests
      await new Promise(r => setTimeout(r, 2000));
    } catch (err) {
      console.error(`  ✗ ${expr}: ${err.message}`);
      failCount++;
    }
  }

  // Generate avatar (unless specific expression was requested)
  if (!targetExpression || targetExpression === "avatar") {
    try {
      const buffer = await generateAvatar();
      const filepath = path.join(outputDir, "kareo-avatar.png");
      fs.writeFileSync(filepath, buffer);
      const sizeKB = (buffer.length / 1024).toFixed(1);
      console.log(`  ✓ kareo-avatar.png (${sizeKB} KB)`);
      successCount++;
    } catch (err) {
      console.error(`  ✗ avatar: ${err.message}`);
      failCount++;
    }
  }

  console.log(`\nDone! Success: ${successCount}, Failed: ${failCount}`);
  console.log(`Output: ${outputDir}`);
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
