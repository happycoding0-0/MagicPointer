"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Magnetic from "@/components/ui/Magnetic";
import { vfs, VFSNode } from "@/lib/vfs";
import { useWindowStore } from "@/store/useWindowStore";
import { dictionary } from "@/locales/dictionary";

export default function FileExplorerApp() {
  const [currentPath, setCurrentPath] = useState<string>("");
  const [nodes, setNodes] = useState<VFSNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { openWindow, systemLanguage } = useWindowStore();
  const t = dictionary[systemLanguage];

  // Inline Creation / Rename State
  const [inlineInput, setInlineInput] = useState<{ active: boolean, type: 'file' | 'folder', text: string, renameNodeId: string | null }>({ active: false, type: 'folder', text: '', renameNodeId: null });
  const inlineInputRef = useRef<HTMLInputElement>(null);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{ visible: boolean, x: number, y: number, node: VFSNode | null }>({ visible: false, x: 0, y: 0, node: null });
  const menuRef = useRef<HTMLDivElement>(null);

  const loadFolder = async (path: string) => {
    setIsLoading(true);
    await vfs.ensureRootFolders();
    const items = await vfs.listFolder(path);
    setNodes(items.sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name);
      return a.type === 'folder' ? -1 : 1;
    }));
    setCurrentPath(path);
    setIsLoading(false);
  };

  useEffect(() => {
    loadFolder(""); // Load root
  }, []);

  useEffect(() => {
    if (inlineInput.active && inlineInputRef.current) {
      inlineInputRef.current.focus();
      inlineInputRef.current.select();
    }
  }, [inlineInput.active]);

  const handleCreateFolderClick = () => {
    setInlineInput({ active: true, type: 'folder', text: 'New Folder', renameNodeId: null });
  };

  const handleCreateFileClick = () => {
    setInlineInput({ active: true, type: 'file', text: 'New Document.txt', renameNodeId: null });
  };

  const submitInlineInput = async () => {
    if (!inlineInput.active) return;
    const name = inlineInput.text.trim();
    if (name) {
      if (inlineInput.renameNodeId) {
        // Handle Rename logic
        const oldNode = nodes.find(n => n.id === inlineInput.renameNodeId);
        if (oldNode && oldNode.name !== name) {
          // Simplistic rename by recreation (real OS requires deep ID update, but for this demo recreate is fine if it's file, folder needs deep move. Since deep move in IDB is complex, we'll just recreate for demo, OR we can implement updateNodeName).
          // Actually vfs doesn't have rename. Let's just create a new one, copy content, delete old.
          if (oldNode.type === 'file') {
             await vfs.createFile(name, currentPath, oldNode.content || "");
             await vfs.deleteNode(oldNode.id);
          } else {
             // To keep it simple, alert user renaming folders is limited in this demo.
             alert("Folder renaming is not fully supported in this VFS demo yet.");
          }
        }
      } else {
        // Handle Create
        if (inlineInput.type === 'folder') {
          await vfs.createFolder(name, currentPath);
        } else {
          await vfs.createFile(name, currentPath, "");
        }
      }
      loadFolder(currentPath);
    }
    setInlineInput({ active: false, type: 'folder', text: '', renameNodeId: null });
  };

  const handleInlineKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') submitInlineInput();
    if (e.key === 'Escape') setInlineInput({ active: false, type: 'folder', text: '', renameNodeId: null });
  };

  const handleNodeClick = (node: VFSNode) => {
    if (node.type === "folder") {
      loadFolder(node.id);
    } else {
      localStorage.setItem("magicos_open_file", node.id);
      openWindow("notes", "Notes", "edit_document");
    }
  };

  const handleGoBack = () => {
    if (currentPath === "") return;
    const parts = currentPath.split("/");
    parts.pop();
    loadFolder(parts.join("/"));
  };

  // Context Menu Handlers (For Files/Folders)
  const handleContextMenu = (e: React.MouseEvent, node: VFSNode) => {
    e.preventDefault();
    e.stopPropagation();
    
    const menuWidth = 200;
    const menuHeight = 160;
    let x = e.clientX;
    let y = e.clientY;
    
    if (x + menuWidth > window.innerWidth) x = window.innerWidth - menuWidth - 10;
    if (y + menuHeight > window.innerHeight) y = window.innerHeight - menuHeight - 10;

    setContextMenu({ visible: true, x, y, node });
  };

  // Context Menu Handlers (For Empty Space)
  const handleEmptySpaceContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Stop bubbling to desktop
    
    const menuWidth = 200;
    const menuHeight = 130;
    let x = e.clientX;
    let y = e.clientY;
    
    if (x + menuWidth > window.innerWidth) x = window.innerWidth - menuWidth - 10;
    if (y + menuHeight > window.innerHeight) y = window.innerHeight - menuHeight - 10;

    setContextMenu({ visible: true, x, y, node: null });
  };

  const closeContextMenu = () => {
    if (contextMenu.visible) setContextMenu({ ...contextMenu, visible: false });
  };

  // Global click/right-click listener to close the context menu when clicking outside
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      // If clicked inside the menu, don't close it (let the onClick handle it)
      if (menuRef.current && menuRef.current.contains(e.target as Node)) {
        return;
      }
      closeContextMenu();
    };
    if (contextMenu.visible) {
      window.addEventListener("mousedown", handleGlobalClick);
    }
    return () => {
      window.removeEventListener("mousedown", handleGlobalClick);
    };
  }, [contextMenu.visible]);

  const actionRename = () => {
    if (!contextMenu.node) return;
    setInlineInput({ active: true, type: contextMenu.node.type, text: contextMenu.node.name, renameNodeId: contextMenu.node.id });
    closeContextMenu();
  };

  const actionDelete = async () => {
    if (!contextMenu.node) return;
    if (confirm(`Are you sure you want to delete '${contextMenu.node.name}'?`)) {
      await vfs.deleteNode(contextMenu.node.id);
      loadFolder(currentPath);
    }
    closeContextMenu();
  };

  const actionNewFolderFromMenu = () => {
    handleCreateFolderClick();
    closeContextMenu();
  };

  const actionNewFileFromMenu = () => {
    handleCreateFileClick();
    closeContextMenu();
  };

  return (
    <div className="flex flex-col w-full h-full bg-[#111111] text-white overflow-hidden rounded-b-2xl select-none" onClick={() => { closeContextMenu(); if(inlineInput.active) submitInlineInput(); }}>
      {/* Toolbar */}
      <div className="flex items-center p-3 bg-black/40 border-b border-white/10 gap-4">
        <div className="flex items-center gap-1">
          <Magnetic as="button" onClick={handleGoBack} radius="8px" className={`p-2 rounded-lg text-slate-300 transition-colors ${currentPath === "" ? 'opacity-30 cursor-default' : 'hover:bg-white/10'}`}>
            <span className="material-symbols-rounded text-lg">arrow_upward</span>
          </Magnetic>
        </div>
        <div className="text-sm text-slate-300 font-mono bg-black/30 px-3 py-1.5 rounded-md border border-white/5 flex-1 truncate cursor-text">
          MagicOS:/{currentPath}
        </div>
        <div className="flex items-center gap-2">
          <Magnetic as="button" onClick={handleCreateFolderClick} radius="8px" className="flex items-center gap-1 px-3 py-1.5 hover:bg-white/10 rounded-lg text-sm text-slate-300 transition-colors">
            <span className="material-symbols-rounded text-lg">create_new_folder</span>
          </Magnetic>
          <Magnetic as="button" onClick={handleCreateFileClick} radius="8px" className="flex items-center gap-1 px-3 py-1.5 hover:bg-white/10 rounded-lg text-sm text-slate-300 transition-colors">
            <span className="material-symbols-rounded text-lg">note_add</span>
          </Magnetic>
        </div>
      </div>

      {/* Content */}
      <div 
        className="flex-1 overflow-auto p-6 relative"
        onContextMenu={handleEmptySpaceContextMenu}
      >
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center text-white/30">Loading Virtual Drive...</div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-6">
            
            {/* Inline Creation/Rename Item (New mode) */}
            {inlineInput.active && !inlineInput.renameNodeId && (
              <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-blue-600/20 border border-blue-500/50" onClick={e => e.stopPropagation()}>
                <span className={`material-symbols-rounded text-5xl ${inlineInput.type === 'folder' ? 'text-blue-400 drop-shadow-[0_0_15px_rgba(66,133,244,0.3)]' : 'text-amber-400 drop-shadow-[0_0_15px_rgba(245,158,11,0.3)]'}`}>
                  {inlineInput.type === 'folder' ? 'folder' : 'description'}
                </span>
                <input 
                  ref={inlineInputRef}
                  type="text" 
                  value={inlineInput.text}
                  onChange={(e) => setInlineInput({ ...inlineInput, text: e.target.value })}
                  onKeyDown={handleInlineKeyDown}
                  onBlur={submitInlineInput}
                  className="w-[120%] text-xs text-center bg-black/50 border border-blue-500 text-white px-1 py-0.5 outline-none cursor-none"
                />
              </div>
            )}

            {nodes.map((node) => (
              <Magnetic 
                key={node.id} 
                onClick={() => handleNodeClick(node)}
                radius="12px"
                className={`flex flex-col items-center gap-3 p-4 rounded-xl transition-colors group relative border border-transparent ${inlineInput.renameNodeId === node.id ? 'bg-blue-600/20 border-blue-500/50' : 'hover:bg-white/10 hover:border-white/10'}`}
              >
                <div 
                  className="absolute inset-0 z-10" 
                  onContextMenu={(e) => handleContextMenu(e, node)}
                ></div>
                
                <span className={`material-symbols-rounded text-5xl transition-transform ${inlineInput.renameNodeId !== node.id && 'group-hover:scale-110'} ${node.type === 'folder' ? 'text-blue-400 drop-shadow-[0_0_15px_rgba(66,133,244,0.3)]' : 'text-amber-400 drop-shadow-[0_0_15px_rgba(245,158,11,0.3)]'}`}>
                  {node.type === 'folder' ? 'folder' : 'description'}
                </span>

                {/* Inline Rename mode or standard text */}
                {inlineInput.active && inlineInput.renameNodeId === node.id ? (
                  <input 
                    ref={inlineInputRef}
                    type="text" 
                    value={inlineInput.text}
                    onChange={(e) => setInlineInput({ ...inlineInput, text: e.target.value })}
                    onKeyDown={handleInlineKeyDown}
                    onBlur={submitInlineInput}
                    onClick={(e) => e.stopPropagation()}
                    className="w-[120%] text-xs text-center bg-black/50 border border-blue-500 text-white px-1 py-0.5 outline-none cursor-none z-20 relative"
                  />
                ) : (
                  <span className="text-xs text-center text-slate-200 truncate w-full font-medium" title={node.name}>
                    {node.name}
                  </span>
                )}
              </Magnetic>
            ))}
            {!inlineInput.active && nodes.length === 0 && (
              <div className="col-span-full w-full h-full flex flex-col items-center justify-center text-white/30 text-sm gap-4 mt-10">
                <span className="material-symbols-rounded text-[5rem] opacity-30">folder_open</span>
                <p>{(t as any).explorer_empty || "This folder is empty."}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* OS Context Menu (Dynamic based on target) via React Portal */}
      {contextMenu.visible && typeof document !== 'undefined' && createPortal(
        <div 
          ref={menuRef}
          className="fixed z-[9999] w-48 bg-[#2b2b2b]/95 backdrop-blur-xl border border-white/10 rounded-md shadow-[0_10px_40px_rgba(0,0,0,0.8)] py-1 text-sm font-sans"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.node ? (
            <>
              {/* Menu for specific File/Folder */}
              <div className="px-4 py-1.5 border-b border-white/5 text-slate-400 text-xs truncate">
                {contextMenu.node.name}
              </div>
              <button onClick={() => { closeContextMenu(); handleNodeClick(contextMenu.node!); }} className="w-full text-left px-4 py-1.5 hover:bg-blue-600/50 flex items-center gap-2 text-slate-200 transition-colors">
                <span className="material-symbols-rounded text-[16px]">open_in_new</span> {(t as any).explorer_open || "Open"}
              </button>
              <button onClick={actionRename} className="w-full text-left px-4 py-1.5 hover:bg-white/10 flex items-center gap-2 text-slate-200 transition-colors">
                <span className="material-symbols-rounded text-[16px]">edit</span> {(t as any).explorer_rename || "Rename"}
              </button>
              <div className="h-[1px] bg-white/10 my-1 mx-2"></div>
              <button onClick={actionDelete} className="w-full text-left px-4 py-1.5 hover:bg-red-500/50 flex items-center gap-2 text-red-200 transition-colors">
                <span className="material-symbols-rounded text-[16px]">delete</span> {(t as any).explorer_delete || "Delete"}
              </button>
            </>
          ) : (
            <>
              {/* Menu for Empty Space */}
              <button onClick={actionNewFolderFromMenu} className="w-full text-left px-4 py-1.5 hover:bg-blue-600/50 flex items-center gap-2 text-slate-200 transition-colors">
                <span className="material-symbols-rounded text-[16px] text-blue-400">create_new_folder</span> {(t as any).explorer_new_folder || "New Folder"}
              </button>
              <button onClick={actionNewFileFromMenu} className="w-full text-left px-4 py-1.5 hover:bg-blue-600/50 flex items-center gap-2 text-slate-200 transition-colors">
                <span className="material-symbols-rounded text-[16px] text-amber-400">note_add</span> {(t as any).explorer_new_file || "New Text File"}
              </button>
              <div className="h-[1px] bg-white/10 my-1 mx-2"></div>
              <button onClick={() => { closeContextMenu(); loadFolder(currentPath); }} className="w-full text-left px-4 py-1.5 hover:bg-white/10 flex items-center gap-2 text-slate-200 transition-colors">
                <span className="material-symbols-rounded text-[16px]">refresh</span> {(t as any).explorer_refresh || "Refresh"}
              </button>
            </>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
