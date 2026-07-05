"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: string;
  color?: string;
  disabled?: boolean;
  onClick: () => void;
  divider?: boolean;
}

interface OSContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  items: ContextMenuItem[];
  onClose: () => void;
}

export default function OSContextMenu({ isOpen, position, items, onClose }: OSContextMenuProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleGlobalClick = () => onClose();
    window.addEventListener("pointerdown", handleGlobalClick);
    window.addEventListener("resize", handleGlobalClick);
    window.addEventListener("scroll", handleGlobalClick, true);
    return () => {
      window.removeEventListener("pointerdown", handleGlobalClick);
      window.removeEventListener("resize", handleGlobalClick);
      window.removeEventListener("scroll", handleGlobalClick, true);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  // Prevent menu from going off-screen
  const ww = typeof window !== 'undefined' ? window.innerWidth : 1000;
  const wh = typeof window !== 'undefined' ? window.innerHeight : 1000;
  const menuWidth = 192; // w-48 = 12rem = 192px
  const menuHeight = items.length * 32 + 16; 
  
  let x = position.x;
  let y = position.y;
  
  if (x + menuWidth > ww) x = ww - menuWidth - 8;
  if (y + menuHeight > wh) y = wh - menuHeight - 8;

  return createPortal(
    <div 
      className="fixed z-[99999] w-48 bg-[#1e1e1e]/90 backdrop-blur-3xl border border-white/10 rounded-xl shadow-[0_15px_40px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col py-1 font-sans ring-1 ring-black"
      style={{ top: y, left: x }}
      onPointerDown={(e) => e.stopPropagation()}
      onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
    >
      {items.map((item, index) => {
        if (item.divider) {
          return <div key={`div-${index}`} className="h-[1px] w-full bg-white/10 my-1"></div>;
        }

        return (
          <button 
            key={item.id}
            onClick={(e) => {
              e.stopPropagation();
              if (item.disabled) return;
              item.onClick();
              onClose();
            }}
            disabled={item.disabled}
            className={`w-full px-3 py-1.5 text-left text-[13px] flex items-center gap-2.5 transition-colors group
              ${item.disabled ? 'opacity-50 cursor-not-allowed text-slate-500' : 'hover:bg-blue-600/80 text-slate-200 hover:text-white'}
            `}
          >
            {item.icon && (
              <span className={`material-symbols-rounded text-[16px] ${item.disabled ? 'text-slate-600' : (item.color || 'text-slate-400 group-hover:text-white')}`}>
                {item.icon}
              </span>
            )}
            <span className={item.color || ""}>{item.label}</span>
          </button>
        );
      })}
    </div>,
    document.body
  );
}
