import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: Request) {
  try {
    console.log("🔍 Received API request...");

    const body = await req.json(); // Parse JSON body
    const { imageBase64 } = body;

    console.log("📸 Image Base64 Received:", imageBase64 ? "✅ Yes" : "❌ No");

    if (!imageBase64) {
      console.log("❌ No image provided!");
      return NextResponse.json({ error: "No image provided." }, { status: 400 });
    }

    console.log("🚀 Sending request to OpenAI...");
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // ✅ Use GPT-4o (or gpt-4o-mini if available)
      messages: [
        { role: "system", content: "You are a fashion expert analyzing outfits." },
        {
          role: "user",
          content: [
            { type: "text", text: "Analyze this outfit and provide style feedback." },
            { type: "image_url", image_url: { url: imageBase64 } }, // ✅ Correct format
          ],
        },
      ],
    });

    console.log("✅ OpenAI API Response:", response);
    return NextResponse.json({ message: response.choices[0].message.content });

  } catch (error) {
    console.error("❌ OpenAI API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to analyze outfit." }, { status: 500 });
  }
}