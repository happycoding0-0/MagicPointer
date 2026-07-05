"use client";

import { useState, useEffect, useRef } from "react";
import Magnetic from "@/components/ui/Magnetic";
import { vfs, VFSNode } from "@/lib/vfs";
import FileDialog from "@/components/ui/FileDialog";
import { useWindowStore } from "@/store/useWindowStore";
import { dictionary } from "@/locales/dictionary";

interface NoteTab {
  id: string;
  node: VFSNode | null;
  content: string;
  isSaved: boolean;
}

export default function NotesApp() {
  // Multi-Tab State
  const [tabs, setTabs] = useState<NoteTab[]>([{ id: crypto.randomUUID(), node: null, content: "", isSaved: true }]);
  const [activeTabId, setActiveTabId] = useState<string>(tabs[0].id);
  
  // Windows 11 Status Bar Data
  const [cursorPos, setCursorPos] = useState({ ln: 1, col: 1 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"open" | "save">("open");
  const [menuOpen, setMenuOpen] = useState(false);

  const { systemLanguage } = useWindowStore();
  const t = dictionary[systemLanguage];

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  // Load pending file from explorer
  useEffect(() => {
    const loadPendingFile = async () => {
      const pendingId = localStorage.getItem("magicos_open_file");
      if (pendingId) {
        localStorage.removeItem("magicos_open_file");
        const node = await vfs.getNode(pendingId);
        if (node && node.type === "file") {
          // If already opened, just focus it
          const existingTab = tabs.find(t => t.node?.id === node.id);
          if (existingTab) {
            setActiveTabId(existingTab.id);
          } else {
            const newTab: NoteTab = { id: crypto.randomUUID(), node, content: node.content || "", isSaved: true };
            // If only 1 empty unsaved tab exists, replace it
            if (tabs.length === 1 && !tabs[0].node && tabs[0].content === "") {
              setTabs([newTab]);
            } else {
              setTabs([...tabs, newTab]);
            }
            setActiveTabId(newTab.id);
          }
        }
      }
    };
    // Polling because cross-app localStorage events in same window might not trigger storage event reliably
    const interval = setInterval(loadPendingFile, 500);
    return () => clearInterval(interval);
  }, [tabs]);

  const updateCursorPos = () => {
    if (!textareaRef.current) return;
    const text = textareaRef.current.value;
    const pos = textareaRef.current.selectionStart;
    const lines = text.substr(0, pos).split("\n");
    setCursorPos({
      ln: lines.length,
      col: lines[lines.length - 1].length + 1
    });
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setTabs(tabs.map(t => t.id === activeTabId ? { ...t, content: newContent, isSaved: false } : t));
    updateCursorPos();
  };

  // Actions
  const actionNew = () => {
    const newTab: NoteTab = { id: crypto.randomUUID(), node: null, content: "", isSaved: true };
    setTabs([...tabs, newTab]);
    setActiveTabId(newTab.id);
    setMenuOpen(false);
  };

  const actionOpen = () => {
    setDialogMode("open");
    setDialogOpen(true);
    setMenuOpen(false);
  };

  const actionSave = async () => {
    setMenuOpen(false);
    if (!activeTab.node) {
      setDialogMode("save");
      setDialogOpen(true);
    } else {
      const updatedNode = await vfs.updateFile(activeTab.node.id, activeTab.content);
      setTabs(tabs.map(t => t.id === activeTabId ? { ...t, node: updatedNode, isSaved: true } : t));
    }
  };

  const actionSaveAs = () => {
    setDialogMode("save");
    setDialogOpen(true);
    setMenuOpen(false);
  };

  const handleDialogConfirm = async (node: VFSNode | null, parentPath?: string, fileName?: string) => {
    if (dialogMode === "open" && node) {
      const existingTab = tabs.find(t => t.node?.id === node.id);
      if (existingTab) {
        setActiveTabId(existingTab.id);
      } else {
        const newTab: NoteTab = { id: crypto.randomUUID(), node, content: node.content || "", isSaved: true };
        if (tabs.length === 1 && !tabs[0].node && tabs[0].content === "") {
          setTabs([newTab]);
        } else {
          setTabs([...tabs, newTab]);
        }
        setActiveTabId(newTab.id);
      }
    } else if (dialogMode === "save" && parentPath !== undefined && fileName) {
      const newNode = await vfs.createFile(fileName, parentPath, activeTab.content);
      setTabs(tabs.map(t => t.id === activeTabId ? { ...t, node: newNode, isSaved: true } : t));
    }
    setDialogOpen(false);
  };

  const closeTab = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const tabToClose = tabs.find(t => t.id === id);
    if (tabToClose && !tabToClose.isSaved) {
      if (!confirm("You have unsaved changes. Close anyway?")) return;
    }
    const newTabs = tabs.filter(t => t.id !== id);
    if (newTabs.length === 0) {
      const fallbackTab: NoteTab = { id: crypto.randomUUID(), node: null, content: "", isSaved: true };
      setTabs([fallbackTab]);
      setActiveTabId(fallbackTab.id);
    } else {
      setTabs(newTabs);
      if (activeTabId === id) setActiveTabId(newTabs[newTabs.length - 1].id);
    }
  };

  // Keyboard Interception (Smart Shortcuts)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey) {
      if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        if (e.shiftKey) {
          actionSaveAs();
        } else {
          actionSave();
        }
      } else if (e.key === 'o' || e.key === 'O') {
        e.preventDefault();
        actionOpen();
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        actionNew();
      }
    }
  };

  return (
    <div className="flex flex-col w-full h-full bg-[#202020] text-slate-200 overflow-hidden rounded-b-2xl font-sans" onClick={() => setMenuOpen(false)}>
      
      {/* Title Bar / Tab Area */}
      <div className="h-10 flex items-end px-2 bg-[#1c1c1c] text-xs text-slate-400 border-b border-black/50 select-none overflow-x-auto no-scrollbar gap-1 pt-2">
        {tabs.map((tab) => (
          <div 
            key={tab.id}
            onClick={() => setActiveTabId(tab.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-t-lg border-t border-x cursor-pointer min-w-[140px] max-w-[200px] transition-colors group ${
              activeTabId === tab.id 
                ? 'bg-[#202020] border-white/10 text-slate-200 shadow-sm z-10' 
                : 'bg-[#1c1c1c] border-transparent hover:bg-[#252525]'
            }`}
          >
            <span className="material-symbols-rounded text-[14px] text-blue-400">description</span>
            <span className="truncate flex-1">{tab.node ? tab.node.name : t.notes_untitled} {tab.isSaved ? "" : "*"}</span>
            <button onClick={(e) => closeTab(e, tab.id)} className={`p-0.5 rounded hover:bg-white/10 transition-colors ${activeTabId === tab.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
              <span className="material-symbols-rounded text-[14px]">close</span>
            </button>
          </div>
        ))}
        <Magnetic as="button" radius="4px" onClick={actionNew} className="p-1.5 mb-1 ml-1 text-slate-400 hover:text-white rounded hover:bg-white/10 transition-colors">
          <span className="material-symbols-rounded text-[18px]">add</span>
        </Magnetic>
      </div>

      {/* Win11 Menu Bar */}
      <div className="flex items-center px-2 py-1 bg-[#202020] border-b border-white/5 relative select-none">
        <div className="relative">
          <Magnetic as="button" radius="4px" onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }} className={`px-3 py-1 rounded text-sm transition-colors ${menuOpen ? 'bg-white/10' : 'hover:bg-white/5'}`}>
            {t.notes_file}
          </Magnetic>
          
          {menuOpen && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-[#2b2b2b] border border-white/10 rounded-md shadow-2xl py-1 z-40 text-sm">
              <button onClick={actionNew} className="w-full text-left px-4 py-1.5 hover:bg-white/10 flex items-center justify-between group">
                <span>{t.notes_new_tab}</span> <span className="text-slate-500 text-xs">Ctrl+N</span>
              </button>
              <button onClick={actionOpen} className="w-full text-left px-4 py-1.5 hover:bg-white/10 flex items-center justify-between group">
                <span>{t.notes_open}</span> <span className="text-slate-500 text-xs">Ctrl+O</span>
              </button>
              <button onClick={actionSave} className="w-full text-left px-4 py-1.5 hover:bg-white/10 flex items-center justify-between group">
                <span>{t.notes_save}</span> <span className="text-slate-500 text-xs">Ctrl+S</span>
              </button>
              <button onClick={actionSaveAs} className="w-full text-left px-4 py-1.5 hover:bg-white/10 flex items-center justify-between group">
                <span>{t.notes_save_as}</span> <span className="text-slate-500 text-xs">Ctrl+Shift+S</span>
              </button>
            </div>
          )}
        </div>
        {/* Dummy Edit/View removed for Immersion */}
      </div>

      {/* Text Area */}
      <div className="flex-1 overflow-hidden relative bg-[#282828]">
        <textarea
          ref={textareaRef}
          className="w-full h-full bg-transparent resize-none outline-none text-slate-100 p-4 font-mono text-[14px] leading-relaxed cursor-none selection:bg-blue-500/40"
          value={activeTab.content}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          onClick={updateCursorPos}
          onKeyUp={updateCursorPos}
          spellCheck="false"
        />
      </div>

      {/* Win11 Status Bar - Diet Version */}
      <div className="flex items-center justify-end px-4 py-1 bg-[#202020] border-t border-white/5 text-[12px] text-slate-400 gap-6 select-none">
        <div>Ln {cursorPos.ln}, Col {cursorPos.col}</div>
      </div>

      {/* Custom File Dialog Modal */}
      <FileDialog 
        mode={dialogMode}
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onConfirm={handleDialogConfirm}
      />
    </div>
  );
}
