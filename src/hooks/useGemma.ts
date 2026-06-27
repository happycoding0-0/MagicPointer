import { useEffect, useRef, useState, useCallback } from 'react';

export interface ProgressState {
  file: string;
  status: 'initiate' | 'downloading' | 'done' | 'progress';
  progress: number;
  loaded: number;
  total: number;
}

export function useGemma() {
  const workerRef = useRef<Worker | null>(null);
  
  const [modelStatus, setModelStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [progressFiles, setProgressFiles] = useState<Record<string, ProgressState>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedText, setGeneratedText] = useState('');
  const [device, setDevice] = useState<'webgpu' | 'wasm'>('webgpu');
  const [modelName, setModelName] = useState<string>('onnx-community/Qwen2.5-1.5B-Instruct');
  const [error, setError] = useState<string | null>(null);
  const [webGpuSupported, setWebGpuSupported] = useState<boolean>(false);

  // Callback references for active generation stream
  const onTokenCallbackRef = useRef<((token: string) => void) | null>(null);
  const onCompleteCallbackRef = useRef<((fullText: string) => void) | null>(null);

  // Check WebGPU support on mount
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'gpu' in navigator) {
      const gpu = (navigator as any).gpu;
      gpu.requestAdapter().then((adapter: any) => {
        setWebGpuSupported(!!adapter);
        if (!adapter) {
          setDevice('wasm'); // Fallback automatically if not supported
        }
      }).catch(() => {
        setWebGpuSupported(false);
        setDevice('wasm');
      });
    } else {
      setWebGpuSupported(false);
      setDevice('wasm');
    }
  }, []);

  // Initialize Web Worker
  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined') return;

    const worker = new Worker(
      new URL('../workers/gemma.worker.ts', import.meta.url),
      { type: 'module' }
    );

    worker.onmessage = (event: MessageEvent) => {
      const { type, data, token, fullText, error: err } = event.data;

      switch (type) {
        case 'status':
          if (data.status === 'ready') {
            setModelStatus('ready');
            setProgressFiles({}); // Clear progress indicators once loaded
          } else if (data.status === 'loading') {
            setModelStatus('loading');
          }
          setStatusMessage(data.message);
          break;

        case 'progress':
          setModelStatus('loading');
          if (data.file) {
            setProgressFiles((prev) => ({
              ...prev,
              [data.file]: {
                file: data.file,
                status: data.status,
                progress: data.progress || 0,
                loaded: data.loaded || 0,
                total: data.total || 0,
              },
            }));
          }
          break;

        case 'generation_started':
          setIsGenerating(true);
          setGeneratedText('');
          break;

        case 'token':
          setGeneratedText((prev) => prev + token);
          if (onTokenCallbackRef.current) {
            onTokenCallbackRef.current(token);
          }
          break;

        case 'generation_completed':
          setIsGenerating(false);
          setGeneratedText(fullText);
          if (onCompleteCallbackRef.current) {
            onCompleteCallbackRef.current(fullText);
          }
          break;

        case 'aborted':
          setIsGenerating(false);
          break;

        case 'error':
          setModelStatus('error');
          setError(err);
          setIsGenerating(false);
          setStatusMessage(`Error: ${err}`);
          break;
      }
    };

    workerRef.current = worker;

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  // Trigger model loading
  const loadModel = useCallback((selectedModel: string, targetDevice: 'webgpu' | 'wasm') => {
    if (!workerRef.current) return;
    setError(null);
    setModelName(selectedModel);
    setDevice(targetDevice);
    setProgressFiles({});
    workerRef.current.postMessage({
      type: 'load',
      data: { modelName: selectedModel, device: targetDevice },
    });
  }, []);

  // Trigger text generation
  const generate = useCallback((
    prompt: string,
    options: {
      max_new_tokens?: number;
      temperature?: number;
      top_k?: number;
    } = {},
    onToken?: (token: string) => void,
    onComplete?: (fullText: string) => void
  ) => {
    if (!workerRef.current || modelStatus !== 'ready') {
      setError('Model is not ready for generation.');
      return;
    }

    onTokenCallbackRef.current = onToken || null;
    onCompleteCallbackRef.current = onComplete || null;

    setGeneratedText('');
    setIsGenerating(true);
    setError(null);

    workerRef.current.postMessage({
      type: 'generate',
      data: { prompt, options },
    });
  }, [modelStatus]);

  // Abort text generation
  const abort = useCallback(() => {
    if (!workerRef.current) return;
    workerRef.current.postMessage({ type: 'abort' });
  }, []);

  // Helper to compute overall progress percentage across all downloading shards
  const getAverageProgress = () => {
    const files = Object.values(progressFiles);
    if (files.length === 0) return 0;
    
    // Sum loaded bytes and total bytes
    let totalLoaded = 0;
    let totalSize = 0;
    
    files.forEach((file) => {
      totalLoaded += file.loaded;
      totalSize += file.total;
    });

    if (totalSize === 0) return 0;
    return Math.round((totalLoaded / totalSize) * 100);
  };

  // Clear transformers model cache
  const clearCache = useCallback(async () => {
    if (typeof window !== 'undefined' && 'caches' in window) {
      try {
        const cacheKeys = await caches.keys();
        for (const key of cacheKeys) {
          if (key.includes('transformers-cache')) {
            await caches.delete(key);
          }
        }
        setStatusMessage('캐시가 성공적으로 삭제되었습니다.');
        setModelStatus('idle'); // Reset status so user can re-download
        alert('모델 캐시가 완전히 삭제되었습니다. 저장 공간이 확보되었습니다.');
      } catch (err) {
        console.error('Failed to clear cache:', err);
        alert('캐시 삭제에 실패했습니다.');
      }
    }
  }, []);

  return {
    modelStatus,
    statusMessage,
    progressFiles,
    averageProgress: getAverageProgress(),
    isGenerating,
    generatedText,
    device,
    modelName,
    error,
    webGpuSupported,
    loadModel,
    generate,
    abort,
    clearCache,
  };
}
