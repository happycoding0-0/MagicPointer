'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Brain, Sparkles, Cpu, Loader2, 
  Trash2, Play, Square, Check, Info, RefreshCw, X, ListTodo, AlignLeft, Search, StickyNote, Bot
} from 'lucide-react';
import { useGemma } from '../../hooks/useGemma';

// Define the sticker state
interface Sticker {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  aiOutput?: string;
  isGenerating?: boolean;
}

// Define the marquee (selection box) state
interface MarqueeState {
  isSelecting: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

export default function StickerBoardPage() {
  const {
    modelStatus,
    statusMessage,
    averageProgress,
    isGenerating: globalIsGenerating,
    generatedText,
    device: activeDevice,
    modelName: activeModelName,
    error: llmError,
    webGpuSupported,
    loadModel,
    generate,
    abort,
    clearCache
  } = useGemma();

  // Board State
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Selection State
  const [marquee, setMarquee] = useState<MarqueeState>({ isSelecting: false, startX: 0, startY: 0, currentX: 0, currentY: 0 });
  const [selectedStickerIds, setSelectedStickerIds] = useState<string[]>([]);
  const [activeGeneratingStickerId, setActiveGeneratingStickerId] = useState<string | null>(null);

  const [selectedModel] = useState('onnx-community/Qwen2.5-0.5B-Instruct');
  const selectedDevice = webGpuSupported ? 'webgpu' : 'wasm';

  // Magic Pointer Popup State (Now just the command palette)
  const [freeformInput, setFreeformInput] = useState('');
  const [universalError, setUniversalError] = useState<string | null>(null);

  // Mouse Tracking States for Panning & Dragging
  const [isPanning, setIsPanning] = useState(false);
  const [draggedStickerId, setDraggedStickerId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [spacePressed, setSpacePressed] = useState(false);

  const workspaceRef = useRef<HTMLDivElement>(null);

  // Load saved content
  useEffect(() => {
    const savedStickers = localStorage.getItem('magic-stickers-v2');
    if (savedStickers) {
      try {
        setStickers(JSON.parse(savedStickers));
      } catch (e) {
        console.error(e);
      }
    } else {
      setStickers([{
        id: `sticker-${generateId()}`,
        x: 150,
        y: 150,
        width: 380,
        height: 220,
        text: '빈 바탕화면을 드래그하여(파란 상자) 이 스티커를 선택해 보세요!\n선택하면 옆에 AI 팝업창이 나타납니다.\n\nAI가 답변을 생성하면 이 스티커 밑으로 창이 스르륵 내려오며 출력됩니다.'
      }]);
    }

    const savedViewport = localStorage.getItem('magic-viewport-v2');
    if (savedViewport) {
      try {
        setViewport(JSON.parse(savedViewport));
      } catch (e) {
        console.error(e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Auto-save content
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('magic-stickers-v2', JSON.stringify(stickers));
      localStorage.setItem('magic-viewport-v2', JSON.stringify(viewport));
    }
  }, [stickers, viewport, isLoaded]);

  // Sync global generating text to the active sticker's output
  useEffect(() => {
    if (activeGeneratingStickerId) {
      setStickers(prev => prev.map(s => 
        s.id === activeGeneratingStickerId 
          ? { ...s, aiOutput: generatedText, isGenerating: globalIsGenerating } 
          : s
      ));
    }
    // If generation finished and we had an error, append it
    if (!globalIsGenerating && llmError && activeGeneratingStickerId) {
       setStickers(prev => prev.map(s => 
        s.id === activeGeneratingStickerId 
          ? { ...s, aiOutput: (s.aiOutput || '') + '\n\n[Error: ' + llmError + ']' } 
          : s
      ));
    }
  }, [generatedText, globalIsGenerating, activeGeneratingStickerId, llmError]);

  // Spacebar panning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && document.activeElement?.tagName !== 'TEXTAREA' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        setSpacePressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') setSpacePressed(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const screenToCanvas = useCallback((clientX: number, clientY: number) => {
    if (!workspaceRef.current) return { x: 0, y: 0 };
    const rect = workspaceRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left - viewport.x) / viewport.zoom,
      y: (clientY - rect.top - viewport.y) / viewport.zoom
    };
  }, [viewport]);

  // Panning & Zooming via Wheel
  useEffect(() => {
    const workspace = workspaceRef.current;
    if (!workspace) return;
    const handleNativeWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) return; 
      e.preventDefault();
      const rect = workspace.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      setViewport(prev => {
        const canvasMouseX = (mouseX - prev.x) / prev.zoom;
        const canvasMouseY = (mouseY - prev.y) / prev.zoom;
        const zoomFactor = 1.1;
        let newZoom = e.deltaY < 0 ? prev.zoom * zoomFactor : prev.zoom / zoomFactor;
        newZoom = Math.max(0.2, Math.min(3, newZoom));
        const newPanX = mouseX - canvasMouseX * newZoom;
        const newPanY = mouseY - canvasMouseY * newZoom;
        return { x: newPanX, y: newPanY, zoom: newZoom };
      });
    };
    workspace.addEventListener('wheel', handleNativeWheel, { passive: false });
    return () => workspace.removeEventListener('wheel', handleNativeWheel);
  }, []);

  // Marquee Selection & Panning logic
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.magic-popup') || (e.target as HTMLElement).closest('.sticker-node') || (e.target as HTMLElement).closest('.bottom-panel')) return;
    
    if (spacePressed || e.button === 1) {
      // Pan
      e.preventDefault();
      setIsPanning(true);
      setDragOffset({ x: e.clientX - viewport.x, y: e.clientY - viewport.y });
    } else if (e.button === 0) {
      // Start Marquee Selection
      const canvasPos = screenToCanvas(e.clientX, e.clientY);
      setMarquee({ isSelecting: true, startX: canvasPos.x, startY: canvasPos.y, currentX: canvasPos.x, currentY: canvasPos.y });
      setSelectedStickerIds([]); // Reset selection
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setViewport(prev => ({ ...prev, x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y }));
      return;
    }
    
    const canvasPos = screenToCanvas(e.clientX, e.clientY);
    
    if (marquee.isSelecting) {
      setMarquee(prev => ({ ...prev, currentX: canvasPos.x, currentY: canvasPos.y }));
      
      // Calculate intersection on the fly
      const left = Math.min(marquee.startX, canvasPos.x);
      const right = Math.max(marquee.startX, canvasPos.x);
      const top = Math.min(marquee.startY, canvasPos.y);
      const bottom = Math.max(marquee.startY, canvasPos.y);

      const selected = stickers.filter(s => {
        // Simple AABB intersection
        return !(s.x > right || s.x + s.width < left || s.y > bottom || s.y + s.height < top);
      }).map(s => s.id);
      
      setSelectedStickerIds(selected);
    } else if (draggedStickerId) {
      setStickers(prev => prev.map(s => 
        s.id === draggedStickerId ? { ...s, x: canvasPos.x - dragOffset.x, y: canvasPos.y - dragOffset.y } : s
      ));
    }
  };

  const handleMouseUpGlobal = () => {
    setIsPanning(false);
    setDraggedStickerId(null);
    if (marquee.isSelecting) {
      setMarquee(prev => ({ ...prev, isSelecting: false }));
    }
  };

  const handleDoubleClickBg = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement) !== workspaceRef.current && !(e.target as HTMLElement).classList.contains('board-bg')) return;
    const canvasPos = screenToCanvas(e.clientX, e.clientY);
    const newSticker: Sticker = {
      id: `sticker-${generateId()}`,
      x: canvasPos.x - 150,
      y: canvasPos.y - 100,
      width: 320,
      height: 200,
      text: ''
    };
    setStickers(prev => [...prev, newSticker]);
    setSelectedStickerIds([newSticker.id]); // Auto-select new sticker
  };

  const startStickerDrag = (e: React.MouseEvent, sticker: Sticker) => {
    e.stopPropagation();
    const canvasPos = screenToCanvas(e.clientX, e.clientY);
    setDraggedStickerId(sticker.id);
    setDragOffset({ x: canvasPos.x - sticker.x, y: canvasPos.y - sticker.y });
    if (!selectedStickerIds.includes(sticker.id)) {
      setSelectedStickerIds([sticker.id]); // Select if not already selected
    }
  };

  const deleteSticker = (id: string) => {
    setStickers(prev => prev.filter(s => s.id !== id));
    setSelectedStickerIds(prev => prev.filter(selectedId => selectedId !== id));
  };

  const clearStickerOutput = (id: string) => {
    setStickers(prev => prev.map(s => s.id === id ? { ...s, aiOutput: undefined, isGenerating: false } : s));
  };

  // AI Actions
  const executeAIAction = async (systemInstruction: string, targetStickerId: string) => {
    setUniversalError(null);
    if (modelStatus !== 'ready') {
      setUniversalError('로컬 AI 모델이 준비되지 않았습니다. 하단에서 Initialize LLM을 눌러주세요.');
      return;
    }

    const targetSticker = stickers.find(s => s.id === targetStickerId);
    if (!targetSticker || !targetSticker.text.trim()) {
      setUniversalError('스티커에 내용이 없습니다.');
      return;
    }

    setActiveGeneratingStickerId(targetStickerId);
    setStickers(prev => prev.map(s => s.id === targetStickerId ? { ...s, aiOutput: '', isGenerating: true } : s));

    const fullPrompt = `${systemInstruction}\n\n[대상 텍스트]\n"${targetSticker.text}"`;
    generate(fullPrompt, { temperature: 0.4, max_new_tokens: 512 });
  };

  const handleActionSummary = () => {
    if (selectedStickerIds.length > 0) {
      executeAIAction('제공된 텍스트를 아주 간결하고 명확하게 핵심 내용만 요약해 주세요.', selectedStickerIds[0]);
    }
  };

  const handleActionAnswer = () => {
    if (selectedStickerIds.length > 0) {
      executeAIAction('제공된 텍스트가 질문이거나 요청사항일 경우, 그에 대해 가장 정확하고 간결하게 답변해 주세요.', selectedStickerIds[0]);
    }
  };

  const handleActionDeleteSticker = () => {
    selectedStickerIds.forEach(id => deleteSticker(id));
  };

  const handleActionTodo = () => {
    if (selectedStickerIds.length > 0) {
      executeAIAction('제공된 텍스트에서 해야 할 일을 파악하여 체크박스([ ]) 형태의 할 일 목록으로 변환해 주세요.', selectedStickerIds[0]);
    }
  };

  const handleActionFreeform = () => {
    if (!freeformInput.trim() || selectedStickerIds.length === 0) return;
    executeAIAction(`다음 질문에 대해 텍스트를 기반으로 답변해 주세요: "${freeformInput}"`, selectedStickerIds[0]);
  };

  // Calculated properties
  const isEngineReady = modelStatus === 'ready';
  const primarySelectedSticker = selectedStickerIds.length > 0 ? stickers.find(s => s.id === selectedStickerIds[0]) : null;

  return (
    <div 
      ref={workspaceRef}
      className="relative w-screen h-screen bg-zinc-100 text-zinc-900 overflow-hidden font-sans select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUpGlobal}
      onDoubleClick={handleDoubleClickBg}
    >
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 h-14 border-b border-zinc-200/50 bg-white/50 backdrop-blur-md flex items-center px-6 justify-between shadow-sm z-40 pointer-events-none">
        <div className="flex items-center gap-2 text-zinc-800">
          <Brain className="w-5 h-5 text-indigo-600" />
          <h1 className="font-bold text-lg tracking-tight">Magic Pointer <span className="text-sm font-medium text-zinc-500 ml-1">Sticker Board</span></h1>
        </div>
        <div className="text-[11px] text-zinc-500 font-medium tracking-wide flex items-center gap-4 bg-zinc-100 px-4 py-1.5 rounded-full">
          <span>빈 공간 더블클릭: 스티커 생성</span>
          <span className="w-1 h-1 bg-zinc-300 rounded-full" />
          <span>바탕화면 드래그: 스티커 선택</span>
        </div>
      </header>

      {/* Canvas Area */}
      <div 
        className="board-bg absolute inset-0 cursor-crosshair active:cursor-grabbing"
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
          transformOrigin: '0 0',
          backgroundImage: 'radial-gradient(rgba(0, 0, 0, 0.08) 1.2px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      >
        {/* Stickers */}
        {stickers.map(sticker => {
          const isSelected = selectedStickerIds.includes(sticker.id);
          
          return (
            <div
              key={sticker.id}
              className={`sticker-node absolute flex flex-col bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all ${
                isSelected ? 'ring-2 ring-indigo-500 shadow-[0_12px_40px_rgba(99,102,241,0.2)]' : 'border border-yellow-200/60 hover:shadow-[0_12px_40px_rgb(0,0,0,0.12)]'
              }`}
              style={{
                left: sticker.x,
                top: sticker.y,
                width: sticker.width,
                // Height is dynamic based on output, but base text area has fixed height
              }}
            >
              {/* Drag Handle Header */}
              <div 
                className={`h-8 flex-none flex items-center justify-between px-3 cursor-grab active:cursor-grabbing group transition-colors rounded-t-xl ${
                  isSelected ? 'bg-indigo-50 border-b border-indigo-100' : 'bg-yellow-50/50 hover:bg-yellow-100/50 border-b border-yellow-100'
                }`}
                onMouseDown={(e) => startStickerDrag(e, sticker)}
              >
                <div className={`flex items-center gap-1.5 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-50 group-hover:opacity-100'}`}>
                  <StickyNote className={`w-3.5 h-3.5 ${isSelected ? 'text-indigo-600' : 'text-yellow-600'}`} />
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); deleteSticker(sticker.id); }}
                  className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 transition-all p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              
              {/* Main Text Area */}
              <textarea
                className="sticker-textarea w-full bg-white text-zinc-800 p-4 resize-none outline-none text-sm leading-relaxed placeholder:text-zinc-300 rounded-b-xl"
                style={{ height: sticker.height }}
                value={sticker.text}
                onChange={(e) => {
                  setStickers(prev => prev.map(s => s.id === sticker.id ? { ...s, text: e.target.value } : s));
                  if (!isSelected) setSelectedStickerIds([sticker.id]);
                }}
                onFocus={() => setSelectedStickerIds([sticker.id])}
                placeholder="내용을 작성하세요..."
                spellCheck="false"
              />

              {/* AI Slide-down Output Window */}
              {(sticker.aiOutput !== undefined || sticker.isGenerating) && (
                <div className="border-t border-indigo-100 bg-indigo-50/50 rounded-b-xl overflow-hidden animate-[slideDown_0.3s_ease-out]">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-indigo-100/50 bg-white/50">
                    <div className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-indigo-500 uppercase">
                      <Bot className="w-3.5 h-3.5" />
                      AI Output
                      {sticker.isGenerating && <Loader2 className="w-3 h-3 animate-spin ml-1 text-indigo-400" />}
                    </div>
                    {!sticker.isGenerating && (
                      <button onClick={() => clearStickerOutput(sticker.id)} className="text-zinc-400 hover:text-zinc-600">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="p-4 text-sm text-zinc-800 leading-relaxed whitespace-pre-wrap break-words max-h-80 overflow-y-auto cursor-text select-text">
                    {sticker.aiOutput}
                    {sticker.isGenerating && <span className="inline-block w-1.5 h-3.5 ml-1 bg-indigo-400 animate-pulse align-middle" />}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Marquee Selection Box */}
        {marquee.isSelecting && (
          <div 
            className="absolute bg-indigo-500/10 border border-indigo-500/40 pointer-events-none"
            style={{
              left: Math.min(marquee.startX, marquee.currentX),
              top: Math.min(marquee.startY, marquee.currentY),
              width: Math.abs(marquee.currentX - marquee.startX),
              height: Math.abs(marquee.currentY - marquee.startY),
            }}
          />
        )}

        {/* Magic Popup (Attached to the first selected sticker) */}
        {primarySelectedSticker && !globalIsGenerating && (
          <div 
            className="magic-popup absolute z-50 w-72 bg-white/95 backdrop-blur-xl border border-zinc-200 rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden animate-[fadeIn_0.15s_ease-out]"
            style={{ 
              left: primarySelectedSticker.x + primarySelectedSticker.width + 20, 
              top: primarySelectedSticker.y 
            }}
          >
            <div className="flex items-center px-4 py-3 border-b border-zinc-100 bg-zinc-50/50">
              <Sparkles className="w-4 h-4 text-indigo-500 mr-2" />
              <span className="text-sm font-semibold text-zinc-700">명령을 선택하세요</span>
            </div>
            
            <div className="p-3 flex flex-col gap-2">
              <button 
                onClick={handleActionAnswer}
                disabled={!isEngineReady}
                className="w-full flex items-center justify-start px-3 gap-2 bg-purple-50 hover:bg-purple-100 text-purple-700 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                바로 답변하기
              </button>
              <button 
                onClick={handleActionSummary}
                disabled={!isEngineReady}
                className="w-full flex items-center justify-start px-3 gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer"
              >
                <AlignLeft className="w-4 h-4" />
                단줄 요약
              </button>
              <button 
                onClick={handleActionTodo}
                disabled={!isEngineReady}
                className="w-full flex items-center justify-start px-3 gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer"
              >
                <ListTodo className="w-4 h-4" />
                할 일 변환
              </button>
              
              <button 
                onClick={handleActionDeleteSticker}
                className="w-full flex items-center justify-start px-3 gap-2 bg-red-50 hover:bg-red-100 text-red-600 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer mt-1 border border-red-100"
              >
                <Trash2 className="w-4 h-4" />
                선택된 스티커 삭제
              </button>
              
              <div className="relative mt-2">
                <input
                  type="text"
                  placeholder="또는 질문 입력..."
                  className="w-full bg-zinc-50 border border-zinc-200 text-zinc-800 text-sm rounded-xl pl-3 pr-9 py-2.5 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-zinc-400"
                  value={freeformInput}
                  onChange={(e) => setFreeformInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleActionFreeform(); }}
                  disabled={!isEngineReady}
                />
                <button
                  onClick={handleActionFreeform}
                  disabled={!isEngineReady || !freeformInput.trim()}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-40 cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
              </div>

              {universalError && (
                <div className="text-xs text-red-500 px-1 mt-1">
                  {universalError}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Model Control Panel */}
      <div className="bottom-panel absolute bottom-6 left-1/2 -translate-x-1/2 z-40 bg-white border border-zinc-200 backdrop-blur-xl rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-6 pointer-events-auto w-max max-w-[90vw]">
        {/* Model status information */}
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${
            modelStatus === 'ready' 
              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
              : modelStatus === 'loading' 
                ? 'bg-amber-50 text-amber-600 border border-amber-100' 
                : 'bg-zinc-50 text-zinc-500 border border-zinc-200'
          }`}>
            {modelStatus === 'loading' ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : modelStatus === 'ready' ? (
              <Check className="w-5 h-5" />
            ) : (
              <Cpu className="w-5 h-5" />
            )}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-800 whitespace-nowrap">
                {modelStatus === 'ready' ? 'Local AI Ready' : modelStatus === 'loading' ? 'Loading Engine...' : 'AI Disconnected'}
              </span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-medium whitespace-nowrap ${
                webGpuSupported ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
              }`}>
                {webGpuSupported ? 'WebGPU Active' : 'WASM Fallback'}
              </span>
            </div>
            <span className="text-[11px] text-zinc-500 mt-0.5 truncate max-w-xs">
              {modelStatus === 'loading' ? statusMessage : `Model: ${activeModelName}`}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 shrink-0">
          {modelStatus === 'loading' ? (
            <div className="flex items-center gap-3 bg-zinc-50 px-4 py-2 rounded-xl border border-zinc-200 w-64">
              <div className="flex-1">
                <div className="flex items-center justify-between text-[10px] text-zinc-500 font-medium mb-1">
                  <span>Downloading...</span>
                  <span>{averageProgress}%</span>
                </div>
                <div className="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full transition-all duration-300" style={{ width: `${averageProgress}%` }} />
                </div>
              </div>
              <button onClick={abort} className="p-1 hover:bg-zinc-200 rounded-lg text-zinc-400 hover:text-red-500">
                <Square className="w-4 h-4 fill-current" />
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => loadModel(selectedModel, selectedDevice)}
                disabled={globalIsGenerating}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4.5 py-2.5 rounded-xl shadow-md transition-colors disabled:opacity-40"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Initialize LLM
              </button>
              
              <button
                onClick={clearCache}
                disabled={globalIsGenerating}
                className="flex items-center gap-1.5 bg-zinc-50 hover:bg-red-50 text-zinc-600 hover:text-red-600 border border-zinc-200 text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-40 cursor-pointer"
                title="다운로드된 AI 모델 삭제 (저장공간 확보)"
              >
                <Trash2 className="w-3.5 h-3.5" />
                모델 삭제
              </button>
              
              {globalIsGenerating && (
                <button onClick={abort} className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold px-4 py-2.5 rounded-xl border border-red-200 transition-colors">
                  <Square className="w-3.5 h-3.5 fill-current" /> Stop AI
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
