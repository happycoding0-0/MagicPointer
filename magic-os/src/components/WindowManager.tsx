"use client";

import { useEffect } from "react";
import { useWindowStore } from "@/store/useWindowStore";
import Window from "./Window";

export default function WindowManager() {
  const { windows, setLanguage } = useWindowStore();

  useEffect(() => {
    const saved = localStorage.getItem('magicos_language');
    if (saved === 'ko' || saved === 'en') {
      setLanguage(saved);
    }
  }, [setLanguage]);

  return (
    <>
      {windows.map((win) => (
        <Window key={win.id} windowState={win} />
      ))}
    </>
  );
}
