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
        model: "gpt-4o-mini",
        messages: [
          { 
            role: "system", 
            content: `You are a professional fashion stylist and personal shopper. 
            When analyzing an outfit, provide:
            1️⃣ **Styling Recommendations** – Small adjustments to improve the current outfit. 
               Examples: "Don't do the top button up", "Pop out the collar", "Try tucking the shirt in on one side".
            2️⃣ **Purchase Recommendations** – A few clothing items that would:
               - Complement the current outfit.
               - Be a great alternative for an item already in the outfit.
            Format the response in JSON:
            { 
              "styling_advice": ["Tip 1", "Tip 2", "Tip 3"], 
              "purchase_recommendations": [
                { 
                  "item": "Item Name", 
                  "description": "Why it works", 
                  "type": "type (e.g. shoes, jacket)",
                  "search_query": "Specific search term for Google Shopping"
                }
              ]
            }`
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
      
      const responseText = response.choices[0].message.content;

      if (!responseText) {
        throw new Error("OpenAI response content is null or undefined.");
      }

      // 🔍 Ensure it's plain JSON (removes code block wrappers)
      const cleanedResponse = responseText.replace(/^```json\n/, "").replace(/\n```$/, "");
      
      console.log("🔍 Cleaned OpenAI Response:", cleanedResponse);
      
      const aiResponse = JSON.parse(cleanedResponse);
      
      return NextResponse.json({
        styling_advice: aiResponse.styling_advice,
        purchase_recommendations: aiResponse.purchase_recommendations,
      });

    console.log("✅ OpenAI API Response:", response);
    return NextResponse.json({ message: response.choices[0].message.content });

  } catch (error) {
    console.error("❌ OpenAI API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to analyze outfit." }, { status: 500 });
  }
}