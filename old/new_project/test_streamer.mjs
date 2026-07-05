import { pipeline, TextStreamer } from '@huggingface/transformers';

async function run() {
  const generator = await pipeline('text-generation', 'onnx-community/Qwen2.5-0.5B-Instruct', {
    device: 'cpu',
    dtype: 'q4',
  });
  
  const streamer = new TextStreamer(generator.tokenizer, {
    skip_prompt: true,
    skip_special_tokens: true,
    callback_function: (text) => {
      process.stdout.write(text);
    }
  });

  const messages = [
    { role: 'system', content: '당신은 유용하고 간결한 브레인스토밍 도우미입니다. 항상 사용자와 동일한 언어로 답변하세요. 절대 동일한 단어나 문장을 반복하지 마세요. 명확하고 직관적인 답변을 제공해야 합니다.' },
    { role: 'user', content: '웹 개발을 시작하려면 어떤 기술을 배워야 할까요?' }
  ];

  await generator(messages, {
    max_new_tokens: 256,
    temperature: 0.4,
    top_k: 30,
    top_p: 0.85,
    repetition_penalty: 1.15,
    do_sample: true,
    streamer: streamer,
  });
  console.log("\nDone");
}

run().catch(console.error);
