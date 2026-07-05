import { GoogleGenAI, Type } from "@google/genai";
import { NextResponse } from "next/server";
import { APPS } from "@/config/apps.config"; // 100% 동적 라우팅을 위한 앱 레지스트리 임포트

// 구글 최신 SDK (@google/genai) 초기화
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const SYSTEM_PROMPT = `You are MagicOS Agent, an AI built directly into the operating system.
Your job is to help the user by answering questions OR executing OS commands.
You have access to Function Calling (Tools) to perform these actions.
If the user asks you to do something that requires an app (like checking weather, finding location, playing music/youtube, or opening an app), you MUST use the corresponding tool.
When you use a tool, you should also provide a brief, polite text response explaining what you did (e.g., "앱을 실행합니다.").
`;

// 동적 앱 리스트 텍스트 생성 (하드코딩 완전 제거)
const availableAppsList = APPS.map(app => `'${app.id}' (${app.name})`).join(', ');

const getOSTools = () => [
  {
    functionDeclarations: [
      {
        name: 'openApp',
        description: 'Opens a specific app in the OS.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            appId: {
              type: Type.STRING,
              description: `ID of the app to open. Available apps: ${availableAppsList}.`,
            },
            payload: {
              type: Type.STRING,
              description: 'CRITICAL: If the user wants to search for something (e.g., news topic, stock name, location, video, music), you MUST provide the search keyword here. (e.g. "삼성전자", "뉴욕", "아이유"). Do not leave empty if a topic is mentioned.',
            },
          },
          required: ['appId'],
        },
      },
      {
        name: 'createFile',
        description: 'Creates a new file in the Virtual File System.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            path: { type: Type.STRING, description: 'Full path of the file (e.g. /Documents/memo.txt)' },
            content: { type: Type.STRING, description: 'Text content to write into the file' }
          },
          required: ['path', 'content'],
        },
      }
    ],
  },
];

export async function POST(req: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured in the server environment." },
        { status: 500 }
      );
    }

    const { prompt, osContext, history, source } = await req.json();
    
    // 출처(Source)에 따른 동적 시스템 프롬프트 설정
    let dynamicSystemPrompt = SYSTEM_PROMPT;
    if (source === "palette") {
      dynamicSystemPrompt += "\n\nCRITICAL RULE: You are invoked from the quick-action Magic Pointer. BE EXTREMELY CONCISE. Maximum 15 words.";
    } else {
      dynamicSystemPrompt += "\n\nCRITICAL RULE: You are invoked from the Magic Assistant. You are a helpful and detailed AI companion. Use rich Markdown.";
    }

    // 대화 내역(History) 윈도우링: 속도 및 비용 최적화를 위해 최근 10개 메시지(5턴)만 유지
    const contents: any[] = [];
    if (history && Array.isArray(history)) {
      const recentHistory = history.slice(-10);
      recentHistory.forEach((msg: any) => {
        contents.push({
          role: msg.sender === "user" ? "user" : "model",
          parts: [{ text: msg.text }]
        });
      });
    }

    const contextMessage = `Current OS Context: ${JSON.stringify(osContext)}\n\nUser Request: ${prompt}`;
    contents.push({ role: "user", parts: [{ text: contextMessage }] });

    // 구글 최신 Interactions API 및 gemini-3.1-flash-lite 모델 호출 (15초 타임아웃)
    const generatePromise = ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
      config: {
        systemInstruction: dynamicSystemPrompt,
        tools: getOSTools() as any,
        temperature: 0.7,
      }
    });

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("API Request Timed Out (15s). Please check your connection.")), 15000)
    );

    const response = await Promise.race([generatePromise, timeoutPromise]) as any;

    let responseText = response.text || "";
    let action = { type: "NONE", payload: {} as any };

    // Function Calling 결과 가로채기
    if (response.functionCalls && response.functionCalls.length > 0) {
      const call = response.functionCalls[0];
      if (call.name === "openApp") {
        action = { type: "OPEN_APP", payload: call.args };
        if (!responseText) responseText = "앱을 엽니다.";
      } else if (call.name === "createFile") {
        action = { type: "CREATE_FILE", payload: call.args };
        if (!responseText) responseText = "파일을 생성합니다.";
      }
    }

    return NextResponse.json({
      response: responseText,
      action
    });

  } catch (error: any) {
    console.error("AI API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
