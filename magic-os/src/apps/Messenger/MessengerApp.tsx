"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useWindowStore } from "@/store/useWindowStore";
import { dictionary } from "@/locales/dictionary";
import { vfs } from "@/lib/vfs";
import Magnetic from "@/components/ui/Magnetic";
import OSContextMenu from "@/components/ui/OSContextMenu";

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: number;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
}

export default function MessengerApp() {
  const { systemLanguage, windows, openWindow } = useWindowStore();
  const t = dictionary[systemLanguage];

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ isOpen: boolean, position: {x:number, y:number}, sessionId: string | null }>({ isOpen: false, position: {x:0, y:0}, sessionId: null });
  
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Focus input when window or session changes
  useEffect(() => {
    if (!isDrawerOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [activeSessionId, isDrawerOpen]);

  // Sync sessions when updated by AIPalette
  useEffect(() => {
    const handleSync = () => {
      const saved = localStorage.getItem("magicos_chat_sessions");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setSessions(parsed);
          if (parsed.length > 0) setActiveSessionId(parsed[0].id);
        } catch (e) {}
      }
    };
    window.addEventListener("sync_magicos_sessions", handleSync);
    return () => window.removeEventListener("sync_magicos_sessions", handleSync);
  }, []);

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem("magicos_chat_sessions");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSessions(parsed);
          // 의도적 변경: 앱을 처음 열 때는 항상 '새 대화(New Chat)' 상태(null)로 시작하도록 변경
          setActiveSessionId(null);
        }
      } catch (e) {}
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem("magicos_chat_sessions", JSON.stringify(sessions));
    }
  }, [sessions]);

  const activeSession = sessions.find(s => s.id === activeSessionId) || null;
  const messages = activeSession?.messages || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleNewChat = () => {
    setActiveSessionId(null);
    setIsDrawerOpen(false);
  };

  const handleSend = async (overridePrompt?: string) => {
    const currentPrompt = overridePrompt || inputText.trim();
    if (!currentPrompt) return;

    let targetSessionId = activeSessionId;
    let currentSessions = [...sessions];

    // If no active session, create one
    if (!targetSessionId) {
      const newSession: ChatSession = {
        id: crypto.randomUUID(),
        title: currentPrompt.slice(0, 20) + (currentPrompt.length > 20 ? "..." : ""),
        messages: [],
        updatedAt: Date.now()
      };
      currentSessions = [newSession, ...currentSessions];
      targetSessionId = newSession.id;
      setActiveSessionId(targetSessionId);
      setSessions(currentSessions);
    }

    const newMsg: Message = {
      id: crypto.randomUUID(),
      sender: "user",
      text: currentPrompt,
      timestamp: Date.now(),
    };

    setSessions(prev => prev.map(s => {
      if (s.id === targetSessionId) {
        return { ...s, messages: [...s.messages, newMsg], updatedAt: Date.now() };
      }
      return s;
    }));
    setInputText("");
    setIsTyping(true);
    
    try {
      const osContext = { 
        activeWindowId: useWindowStore.getState().activeWindowId,
        openWindows: useWindowStore.getState().windows.filter(w => w.isOpen).map(w => w.id),
        systemLanguage: useWindowStore.getState().systemLanguage,
      };

      const historyToSync = currentSessions.find(s => s.id === targetSessionId)?.messages || [];
      const messagesPayload = [...historyToSync, newMsg].map(m => ({
        role: m.sender === "user" ? "user" : "model",
        content: m.text
      }));

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: messagesPayload, osContext })
      });

      if (!res.body) throw new Error("No body returned");

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");

      let aiMessage = "";
      const aiMsgId = crypto.randomUUID();

      // Add empty AI message placeholder for streaming
      setSessions(prev => prev.map(s => {
        if (s.id === targetSessionId) {
          return { ...s, messages: [...s.messages, { id: aiMsgId, sender: "ai", text: "", timestamp: Date.now() }], updatedAt: Date.now() };
        }
        return s;
      }));

      setIsTyping(false); // Remove bubble animation since text will start typing

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        
        // SSE parsing
        const lines = chunk.split("\n\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6);
            if (dataStr === "[DONE]") continue;
            
            try {
              const data = JSON.parse(dataStr);
              if (data.type === "text") {
                aiMessage += data.content;
                setSessions(prev => prev.map(s => {
                  if (s.id === targetSessionId) {
                    return {
                      ...s,
                      messages: s.messages.map(m => m.id === aiMsgId ? { ...m, text: aiMessage } : m)
                    };
                  }
                  return s;
                }));
              } else if (data.type === "functionCall") {
                for (const call of data.calls) {
                  const { name, args } = call;
                  
                  if (name === "openApp") {
                    // Open the requested app
                    const iconMap: Record<string, string> = {
                      'explorer': 'folder', 'notes': 'edit_document', 'welcome': 'explore', 
                      'settings': 'settings', 'media': 'play_circle', 'news': 'newspaper', 
                      'stock': 'show_chart', 'map': 'map', 'browser': 'public'
                    };
                    const icon = iconMap[args.appId] || 'widgets';
                    useWindowStore.getState().openWindow(args.appId, args.appId.charAt(0).toUpperCase() + args.appId.slice(1), icon, undefined, args.payload);
                  } else if (name === "closeApp") {
                    useWindowStore.getState().closeWindow(args.appId);
                  } else if (name === "maximizeApp") {
                    useWindowStore.getState().toggleMaximize(args.appId);
                  } else if (name === "changeTheme") {
                    if (args.theme === 'dark') document.documentElement.classList.add('dark');
                    else document.documentElement.classList.remove('dark');
                  } else if (name === "searchWeb") {
                    useWindowStore.getState().openWindow("browser", "Web Browser", "public", undefined, args.query);
                  }
                }
              } else if (data.type === "error") {
                aiMessage += `\n\n⚠️ **Error:** ${data.message}`;
                setSessions(prev => prev.map(s => {
                  if (s.id === targetSessionId) {
                    return {
                      ...s,
                      messages: s.messages.map(m => m.id === aiMsgId ? { ...m, text: aiMessage } : m)
                    };
                  }
                  return s;
                }));
              }
            } catch (e) {
              console.error("SSE parse error", e);
            }
          }
        }
      }

    } catch (error) {
      setIsTyping(false);
      setSessions(prev => prev.map(s => s.id === targetSessionId ? {
        ...s, 
        messages: [...s.messages, { id: crypto.randomUUID(), sender: "ai", text: `⚠️ **Network Error**`, timestamp: Date.now() }],
        updatedAt: Date.now()
      } : s));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex w-full h-full bg-black/40 backdrop-blur-2xl text-slate-200 overflow-hidden rounded-b-2xl font-sans relative">
      
      {/* Drawer Overlay */}
      {isDrawerOpen && (
        <div 
          className="absolute inset-0 bg-black/50 z-40 transition-opacity"
          onClick={() => setIsDrawerOpen(false)}
        />
      )}

      {/* Drawer Sidebar */}
      <div className={`absolute top-0 left-0 bottom-0 w-64 bg-[#141414]/90 backdrop-blur-3xl border-r border-white/10 z-50 transform transition-transform duration-300 ease-out flex flex-col ${isDrawerOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 border-b border-white/5 flex items-center justify-center shrink-0">
          <span className="font-semibold text-slate-200">{t.msg_chat_history}</span>
        </div>
        
        <div className="p-4 shrink-0">
          <button 
            onClick={handleNewChat}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-symbols-rounded text-sm">add</span>
            {t.msg_new_chat}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1">
          {sessions.map(s => (
            <button 
              key={s.id}
              onClick={() => { setActiveSessionId(s.id); setIsDrawerOpen(false); }}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setContextMenu({ isOpen: true, position: { x: e.clientX, y: e.clientY }, sessionId: s.id });
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm truncate transition-colors ${activeSessionId === s.id ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
            >
              <span className="material-symbols-rounded text-[14px] mr-2 align-middle">chat_bubble</span>
              {s.title}
            </button>
          ))}
          {sessions.length === 0 && (
            <div className="text-center text-xs text-slate-500 mt-4">{t.msg_no_past_conversations}</div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header */}
        <div className="h-14 flex items-center px-4 justify-between shrink-0 border-b border-white/5 bg-white/5 select-none">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsDrawerOpen(true)} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 transition-colors">
              <span className="material-symbols-rounded">menu</span>
            </button>
            <div className="flex items-center gap-2">
              <span className="material-symbols-rounded text-blue-400">auto_awesome</span>
              <span className="font-medium text-sm text-slate-200 tracking-wide">{t.app_messenger}</span>
            </div>
          </div>
        </div>

        {/* Messages or Empty State */}
        {(!activeSession || messages.length === 0) && !isTyping ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-500 shadow-[0_0_30px_rgba(59,130,246,0.3)] flex items-center justify-center mb-6">
              <span className="material-symbols-rounded text-white text-3xl">auto_awesome</span>
            </div>
            <h2 className="text-2xl font-semibold text-slate-100 mb-8">{t.msg_how_can_i_help}</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl w-full">
              <button onClick={() => handleSend("현재 열려있는 앱들을 요약해 줘")} className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-left transition-colors group">
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-rounded text-blue-400 text-[18px]">summarize</span>
                  <span className="font-medium text-sm text-slate-200">{t.msg_chip_status_title}</span>
                </div>
                <p className="text-xs text-slate-400 group-hover:text-slate-300">{t.msg_chip_status_desc}</p>
              </button>
              <button onClick={() => handleSend("새로운 빈 메모장을 열어 줘")} className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-left transition-colors group">
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-rounded text-amber-400 text-[18px]">edit_document</span>
                  <span className="font-medium text-sm text-slate-200">{t.msg_chip_note_title}</span>
                </div>
                <p className="text-xs text-slate-400 group-hover:text-slate-300">{t.msg_chip_note_desc}</p>
              </button>
              <button onClick={() => handleSend("바탕화면 테마를 변경하는 법 알려줘")} className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-left transition-colors group">
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-rounded text-purple-400 text-[18px]">palette</span>
                  <span className="font-medium text-sm text-slate-200">{t.msg_chip_theme_title}</span>
                </div>
                <p className="text-xs text-slate-400 group-hover:text-slate-300">{t.msg_chip_theme_desc}</p>
              </button>
              <button onClick={() => handleSend("/Documents/hello.txt 에 인사말을 작성해서 저장해")} className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-left transition-colors group">
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-rounded text-green-400 text-[18px]">note_add</span>
                  <span className="font-medium text-sm text-slate-200">{t.msg_chip_file_title}</span>
                </div>
                <p className="text-xs text-slate-400 group-hover:text-slate-300">{t.msg_chip_file_desc}</p>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8 no-scrollbar scroll-smooth">
            {messages.map((msg) => {
              const isMe = msg.sender === "user";
              return (
                <div key={msg.id} className="flex gap-4 max-w-4xl mx-auto w-full group">
                  <div className="shrink-0 mt-1">
                    {isMe ? (
                      <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                        <span className="material-symbols-rounded text-slate-400 text-[18px]">person</span>
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 shadow-[0_0_15px_rgba(59,130,246,0.4)] flex items-center justify-center">
                        <span className="material-symbols-rounded text-white text-[18px]">auto_awesome</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-semibold text-slate-300">{isMe ? "You" : t.app_messenger}</span>
                      <span className="text-[10px] text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="prose prose-invert max-w-none text-[14px] leading-relaxed text-slate-200 prose-p:my-1 prose-a:text-blue-400 prose-code:text-amber-300 prose-code:bg-black/30 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10 prose-headings:text-slate-100">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.text}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {isTyping && (
              <div className="flex gap-4 max-w-4xl mx-auto w-full">
                <div className="shrink-0 mt-1">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 shadow-[0_0_15px_rgba(59,130,246,0.4)] flex items-center justify-center">
                    <span className="material-symbols-rounded text-white text-[18px]">auto_awesome</span>
                  </div>
                </div>
                <div className="flex-1 flex flex-col justify-center h-8">
                  <div className="flex items-center gap-1.5 px-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "0ms" }}></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "150ms" }}></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "300ms" }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        )}

        {/* Input Area */}
        <div className="px-6 py-4 shrink-0 w-full max-w-4xl mx-auto">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl flex items-end shadow-2xl focus-within:border-blue-500/50 focus-within:bg-white/10 transition-all p-1 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-purple-500/0 pointer-events-none"></div>
            
            <Magnetic as="button" radius="12px" className="p-3 text-slate-400 hover:text-white transition-colors shrink-0 z-10">
              <span className="material-symbols-rounded text-[22px]">add</span>
            </Magnetic>
            
            <textarea
              ref={inputRef}
              className="flex-1 bg-transparent border-none outline-none resize-none text-[15px] text-slate-100 py-3.5 px-2 max-h-32 min-h-[48px] z-10 placeholder-slate-500"
              placeholder={t.msg_type_placeholder}
              rows={1}
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 128) + "px";
              }}
              onKeyDown={handleKeyDown}
              spellCheck={false}
            />
            
            <Magnetic as="button" radius="12px" onClick={() => handleSend()} className={`p-3 transition-colors shrink-0 z-10 ${inputText.trim() ? "text-blue-400 hover:text-blue-300" : "text-slate-600"}`}>
              <span className="material-symbols-rounded text-[22px]">{inputText.trim() ? "send" : "mic"}</span>
            </Magnetic>
          </div>
        </div>

      </div>

      {/* Context Menu for Sessions */}
      <OSContextMenu 
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        onClose={() => setContextMenu({ ...contextMenu, isOpen: false })}
        items={[
          {
            id: "delete",
            label: "대화 삭제",
            icon: "delete",
            color: "text-red-400",
            onClick: () => {
              if (contextMenu.sessionId) {
                setSessions(prev => prev.filter(s => s.id !== contextMenu.sessionId));
                if (activeSessionId === contextMenu.sessionId) {
                  setActiveSessionId(null);
                }
              }
            }
          }
        ]}
      />
    </div>
  );
}
