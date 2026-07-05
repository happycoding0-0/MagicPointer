import { pipeline } from '@huggingface/transformers';

async function run() {
  console.log("Loading Qwen 2.5 0.5B Instruct model...");
  const generator = await pipeline('text-generation', 'onnx-community/Qwen2.5-0.5B-Instruct', {
    device: 'cpu',
    dtype: 'q4',
  });
  
  const messages = [
    { role: 'system', content: 'You are a helpful, concise brainstorming assistant. Always respond in the same language as the user. Never repeat yourself. Give direct, clear answers.' },
    { role: 'user', content: '안녕' }
  ];

  console.log("Generating response for '안녕'...");
  const output = await generator(messages, {
    max_new_tokens: 128,
    temperature: 0.5,
    top_k: 30,
    top_p: 0.85,
    repetition_penalty: 1.1,
  });

  console.log("Raw Output:", output);
  console.log("Response text:", output[0]?.generated_text);
}

run().catch(console.error);
