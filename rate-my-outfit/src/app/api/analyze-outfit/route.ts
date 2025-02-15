import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: Request) {
  try {
    console.log("🔍 Received API request...");

    const body = await req.json();
    const { imageBase64 } = body;

    if (!imageBase64) {
      return NextResponse.json({ error: "No image provided." }, { status: 400 });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: [
          { 
            role: "system", 
            content: `You are a professional fashion stylist and personal shopper...`
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze this outfit and provide recommendations." },
              { type: "image_url", image_url: { url: imageBase64 } }
            ],
          },
        ],
    });
      
    const content = response.choices[0].message.content;
    if (content) {
      return NextResponse.json(JSON.parse(content));
    } else {
      return NextResponse.json({ error: "No content in response" }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: "Failed to analyze outfit" }, { status: 500 });
  }
}