"use client";

import { useState, useEffect } from "react";
import Magnetic from "@/components/ui/Magnetic";
import { vfs, VFSNode } from "@/lib/vfs";

interface FileDialogProps {
  mode: "open" | "save";
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (node: VFSNode | null, parentPath?: string, fileName?: string) => void;
}

export default function FileDialog({ mode, isOpen, onClose, onConfirm }: FileDialogProps) {
  const [currentPath, setCurrentPath] = useState<string>("");
  const [nodes, setNodes] = useState<VFSNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<VFSNode | null>(null);
  const [fileNameInput, setFileNameInput] = useState("Untitled.txt");

  useEffect(() => {
    if (isOpen) {
      loadFolder("");
      setSelectedNode(null);
    }
  }, [isOpen]);

  const loadFolder = async (path: string) => {
    await vfs.ensureRootFolders();
    const items = await vfs.listFolder(path);
    setNodes(items.sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name);
      return a.type === 'folder' ? -1 : 1;
    }));
    setCurrentPath(path);
  };

  if (!isOpen) return null;

  const handleNodeClick = (node: VFSNode) => {
    setSelectedNode(node);
    if (node.type === "file") {
      setFileNameInput(node.name);
    }
  };

  const handleNodeDoubleClick = (node: VFSNode) => {
    if (node.type === "folder") {
      loadFolder(node.id);
      setSelectedNode(null);
    } else if (mode === "open") {
      onConfirm(node);
    }
  };

  const handleConfirm = async () => {
    if (mode === "open") {
      if (selectedNode && selectedNode.type === "file") {
        onConfirm(selectedNode);
      } else {
        alert("Please select a file to open.");
      }
    } else {
      // Save mode
      if (!fileNameInput.trim()) {
        alert("Please enter a file name.");
        return;
      }
      onConfirm(null, currentPath, fileNameInput.trim());
    }
  };

  const goUp = () => {
    if (currentPath === "") return;
    const parts = currentPath.split("/");
    parts.pop();
    loadFolder(parts.join("/"));
    setSelectedNode(null);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-[450px] h-[350px] bg-[#1c1c1c] border border-white/10 rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-white/5 bg-[#252525]">
          <h3 className="text-white text-sm font-medium">{mode === "open" ? "Open File" : "Save As"}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors cursor-none">
            <span className="material-symbols-rounded text-lg">close</span>
          </button>
        </div>

        {/* Path Nav */}
        <div className="flex items-center p-2 bg-[#1a1a1a] border-b border-white/5 gap-2">
          <Magnetic as="button" radius="4px" onClick={goUp} className={`p-1 text-slate-300 rounded hover:bg-white/10 transition-colors ${currentPath === "" ? 'opacity-30 cursor-default' : ''}`}>
            <span className="material-symbols-rounded text-[1rem]">arrow_upward</span>
          </Magnetic>
          <div className="flex-1 text-xs text-slate-300 px-2 py-1 bg-black/40 border border-white/5 rounded truncate">
            MagicOS:/{currentPath}
          </div>
        </div>

        {/* File List */}
        <div className="flex-1 overflow-auto p-2">
          {nodes.map((node) => (
            <Magnetic
              key={node.id}
              radius="6px"
              onClick={() => handleNodeClick(node)}
              onDoubleClick={() => handleNodeDoubleClick(node)}
              className={`flex items-center gap-2 p-1.5 px-3 rounded-md transition-colors cursor-pointer select-none ${selectedNode?.id === node.id ? 'bg-blue-600/40 text-white' : 'text-slate-300 hover:bg-white/5'}`}
            >
              <span className={`material-symbols-rounded text-[18px] ${node.type === 'folder' ? 'text-blue-400' : 'text-slate-400'}`}>
                {node.type === 'folder' ? 'folder' : 'description'}
              </span>
              <span className="text-sm truncate">{node.name}</span>
            </Magnetic>
          ))}
          {nodes.length === 0 && (
            <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">This folder is empty.</div>
          )}
        </div>

        {/* Footer (Save Input) */}
        <div className="p-3 border-t border-white/5 bg-[#252525] flex flex-col gap-2">
          {mode === "save" && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 w-16">File name:</span>
              <input 
                type="text" 
                value={fileNameInput} 
                onChange={(e) => setFileNameInput(e.target.value)}
                className="flex-1 bg-black/40 border border-white/10 rounded px-2 py-1 text-sm text-white outline-none focus:border-blue-500 cursor-none"
              />
            </div>
          )}
          <div className="flex items-center justify-end gap-2 mt-1">
            <Magnetic as="button" radius="6px" onClick={onClose} className="px-4 py-1.5 rounded bg-white/5 hover:bg-white/10 text-white text-sm transition-colors border border-white/5">
              Cancel
            </Magnetic>
            <Magnetic as="button" radius="6px" onClick={handleConfirm} className="px-4 py-1.5 rounded bg-blue-500 hover:bg-blue-600 text-white text-sm transition-colors shadow-lg shadow-blue-500/20 font-medium min-w-[70px]">
              {mode === "open" ? "Open" : "Save"}
            </Magnetic>
          </div>
        </div>
      </div>
    </div>
  );
}
