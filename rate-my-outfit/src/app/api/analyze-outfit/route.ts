import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: Request) {
  try {
    console.log("🔍 Received API request...");

    const body = await req.json();
    const { imageBase64 } = body;

    console.log("📸 Image Base64 Received:", imageBase64 ? "✅ Yes" : "❌ No");

    if (!imageBase64) {
      console.log("❌ No image provided!");
      return NextResponse.json({ error: "No image provided." }, { status: 400 });
    }

    // Reduce image size by removing data URL prefix if present
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    // Take only first 50KB of image data to reduce tokens
    const truncatedBase64 = base64Data.substring(0, 50000);

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
          2️⃣ **Purchase Recommendations** – A few specific clothing items that would:
             - Complement the current outfit.
             - Be a great alternative for an item already in the outfit.
             Be very specific with item descriptions for accurate shopping results.
          Format the response in JSON:
          { 
            "styling_advice": ["Tip 1", "Tip 2", "Tip 3"], 
            "purchase_recommendations": [
              { "item": "Item Name", "description": "Why it works", "type": "type (e.g. shoes, jacket)", "search_query": "Specific search term" }
            ]
          }`
        },
        {
          role: "user",
          content: `Analyze this outfit: data:image/jpeg;base64,${truncatedBase64}`
        }
      ]
    });

    try {
      console.log("✅ Received OpenAI response");
    
      const result = response.choices[0]?.message?.content;
      if (!result) {
        throw new Error("No response from OpenAI");
      }

      try {
        // Clean up the response by removing markdown code block syntax
        const cleanResult = result
          .replace(/```json\n?/, '') // Remove opening ```json
          .replace(/```\n?$/, '')    // Remove closing ```
          .trim();                   // Remove any extra whitespace

        console.log("Cleaned response:", cleanResult);
        const parsedResult = JSON.parse(cleanResult);
        return NextResponse.json(parsedResult);
      } catch (parseError) {
        console.error("❌ Failed to parse OpenAI response:", parseError);
        console.error("Raw response:", result);
        return NextResponse.json({ 
          error: "Failed to parse analysis results.",
          rawResponse: result 
        }, { status: 500 });
      }

    } catch (error: unknown) {
      console.error("❌ OpenAI API Error:", error);
      return NextResponse.json({ 
        error: error instanceof Error ? error.message : "Failed to analyze outfit.",
        details: JSON.stringify(error)
      }, { status: 500 });
    }

  } catch (error: unknown) {
    console.error("❌ OpenAI API Error:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to analyze outfit." 
    }, { status: 500 });
  }
}