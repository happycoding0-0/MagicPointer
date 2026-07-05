import { pipeline, env, TextStreamer } from '@huggingface/transformers';

// Set up ONNX Runtime Web environment configuration
env.allowLocalModels = false;

// Optimization for WASM (WebAssembly) fallback
if (typeof navigator !== 'undefined' && env.backends?.onnx) {
  const onnxBackend = env.backends.onnx as any;
  if (!onnxBackend.wasm) onnxBackend.wasm = {};
  onnxBackend.wasm.numThreads = navigator.hardwareConcurrency || 4;
  
  if (!onnxBackend.webgpu) onnxBackend.webgpu = {};
  onnxBackend.webgpu.powerPreference = 'high-performance';
}

let generator: any = null;
let isAborted = false;

// Custom Streamer that can abort text generation mid-way by throwing an error
class AbortableTextStreamer extends TextStreamer {
  constructor(tokenizer: any, on_token: (text: string) => void) {
    super(tokenizer, {
      skip_prompt: true,
      skip_special_tokens: true,
      callback_function: (text: string) => {
        if (isAborted) {
          throw new Error('aborted');
        }
        on_token(text);
      }
    });
  }
}

// Listen to messages from the main thread
self.addEventListener('message', async (event: MessageEvent) => {
  const { type, data } = event.data;

  if (type === 'load') {
    const { modelName, device } = data;
    await loadModel(modelName, device);
  } else if (type === 'generate') {
    const { prompt, options } = data;
    await generateText(prompt, options);
  } else if (type === 'abort') {
    isAborted = true;
    self.postMessage({ type: 'aborted' });
  }
});

// Load the text generation model
async function loadModel(modelName: string, device: 'webgpu' | 'wasm') {
  self.postMessage({ type: 'status', data: { status: 'loading', message: `Initializing ${modelName} on ${device}...` } });

  try {
    // If there is an existing pipeline, we dispose of it to free GPU/system memory
    if (generator) {
      try {
        if (generator.model && typeof generator.model.dispose === 'function') {
          await generator.model.dispose();
        }
      } catch (e) {
        console.warn('Failed to dispose existing model', e);
      }
      generator = null;
    }

    generator = await pipeline('text-generation', modelName, {
      device: device,
      dtype: 'q4',
      progress_callback: (progressData: any) => {
        // Broadcast download progress to main thread
        self.postMessage({ type: 'progress', data: progressData });
      }
    });

    self.postMessage({ type: 'status', data: { status: 'ready', message: 'Model loaded successfully!' } });
  } catch (error: any) {
    console.error(`Error in worker loadModel on device ${device}:`, error);

    // If WebGPU failed, attempt to automatically fall back to CPU (WASM)
    if (device === 'webgpu') {
      console.warn('WebGPU session creation failed. Attempting automatic fallback to WASM...');
      self.postMessage({ 
        type: 'status', 
        data: { 
          status: 'loading', 
          message: 'WebGPU failed (Out of Memory). Retrying with CPU (WASM) automatically...' 
        } 
      });
      // Recursively attempt WASM load
      await loadModel(modelName, 'wasm');
    } else {
      // If WASM also fails, report the error
      self.postMessage({ type: 'error', error: error.message || 'Unknown error occurred while loading the model.' });
    }
  }
}

// Generate text from a prompt and stream back tokens
async function generateText(prompt: string, options: any = {}) {
  if (!generator) {
    self.postMessage({ type: 'error', error: 'Model has not been loaded yet.' });
    return;
  }

  isAborted = false;
  self.postMessage({ type: 'generation_started' });

  try {
    const streamer = new AbortableTextStreamer(generator.tokenizer, (token: string) => {
      self.postMessage({ type: 'token', token });
    });

    // Wrap in chat message structure to let Transformers.js automatically apply the model's Chat Template
    const messages = [
      { role: 'system', content: '당신은 유용하고 간결한 브레인스토밍 도우미입니다. 항상 사용자와 동일한 언어로 답변하세요. 절대 동일한 단어나 문장을 반복하지 마세요. 명확하고 직관적인 답변을 제공해야 합니다.' },
      { role: 'user', content: prompt }
    ];

    const generationOptions = {
      ...options, // User options first, then our guardrails override below
      max_new_tokens: options.max_new_tokens || 512,
      temperature: options.temperature ?? 0.4, // Lower temperature for more factual, accurate Korean
      top_k: options.top_k ?? 30,
      top_p: options.top_p ?? 0.85,
      repetition_penalty: 1.15, // Slightly lower penalty as 1.5B model needs less aggressive penalization than 0.5B
      do_sample: true,
      streamer: streamer,
    };

    const output = await generator(messages, generationOptions);
    
    // Extract the assistant's response text from the output.
    // In chat mode, generated_text is an array of message objects:
    //   [{role: 'user', content: '...'}, {role: 'assistant', content: '...'}]
    // In plain mode, it's a raw string.
    let fullText = '';
    const generatedText = output[0]?.generated_text;

    if (Array.isArray(generatedText)) {
      // Chat format: extract the last assistant message's content
      const lastMessage = generatedText[generatedText.length - 1];
      fullText = typeof lastMessage === 'string' ? lastMessage : (lastMessage?.content || '');
    } else if (typeof generatedText === 'string') {
      fullText = generatedText;
    }

    self.postMessage({ type: 'generation_completed', fullText });
  } catch (error: any) {
    if (error.message === 'aborted') {
      console.log('Generation was aborted by user.');
    } else {
      console.error('Error in worker generateText:', error);
      self.postMessage({ type: 'error', error: error.message || 'Generation failed.' });
    }
  }
}
