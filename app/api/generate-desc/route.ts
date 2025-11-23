import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // 👇 यहाँ अपनी Groq API Key पेस्ट करें
    
const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("API Key missing");

    const body = await req.json();
    const { keywords } = body;

    // --- UPDATED GROQ API CALL ---
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: `Write a very short (50 words), attractive real estate listing description for a room with these details: ${keywords}`,
          },
        ],
        // 👇 यहाँ बदलाव किया है: NEW MODEL NAME
        model: "llama-3.3-70b-versatile", 
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Groq API Failed");
    }

    const data = await response.json();
    const text = data.choices[0]?.message?.content;

    return NextResponse.json({ output: text });

  } catch (error: any) {
    console.error("❌ ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}