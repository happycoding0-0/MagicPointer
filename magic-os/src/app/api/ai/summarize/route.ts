import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { articles, query } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "No API key" }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    // We only need the titles and short descriptions to save tokens
    const textToSummarize = articles.slice(0, 10).map((a: any, i: number) => `${i+1}. ${a.title}`).join('\n');
    
    const prompt = `You are a highly intelligent news analyst AI embedded in MagicOS.
The user is looking at news articles about: "${query || 'Latest Headlines'}".
Here are the top headlines:
${textToSummarize}

Please provide a concise, insightful 3-4 sentence summary of the current situation or trend based ONLY on these headlines. 
Keep your tone professional yet accessible. Do not list the headlines, just provide a synthesized summary paragraph.
Respond in Korean.`;

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const responseStream = await ai.models.generateContentStream({
            model: "gemini-2.5-flash", // 통일성 유지 및 안정성
            contents: [{ role: "user", parts: [{ text: prompt }] }], // 엄격한 포맷팅 적용
            config: {
              temperature: 0.3,
            }
          });

          for await (const chunk of responseStream) {
            if (chunk.text) {
              controller.enqueue(new TextEncoder().encode(chunk.text));
            }
          }
          controller.close();
        } catch (err: any) {
          console.error("Gemini API Error in summarize:", err);
          controller.enqueue(new TextEncoder().encode("요약을 생성하는 중 오류가 발생했습니다."));
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
