const { GoogleGenAI } = require('@google/genai');

async function run() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.list();
  for (const model of response) {
    if (model.name.includes("flash") || model.name.includes("pro")) {
      console.log(model.name);
    }
  }
}
run();
