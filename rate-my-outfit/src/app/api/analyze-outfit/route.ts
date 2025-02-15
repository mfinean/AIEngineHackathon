import { NextResponse } from "next/server";
import OpenAI from "openai";

// console.log("OpenAI API Key:", process.env.OPENAI_API_KEY ? "Loaded ✅" : "Not Found ❌");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    console.log("🔍 Received API request...");

    const { imageUrl } = await req.json();
    console.log("📸 Image URL:", imageUrl);

    if (!imageUrl) {
      console.log("❌ No image provided!");
      return NextResponse.json({ error: "No image provided." }, { status: 400 });
    }

    console.log("🚀 Sending request to OpenAI...");
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a fashion expert analyzing outfits." },
        { role: "user", content: `Analyze this outfit and provide style feedback: ${imageUrl}` },
      ],
    });

    console.log("✅ OpenAI Response:", response);

    return NextResponse.json({ message: response.choices[0].message.content });

  } catch (error) {
    console.error("❌ OpenAI API Error:", error);
    return NextResponse.json({ error: "Failed to analyze outfit." }, { status: 500 });
  }
}