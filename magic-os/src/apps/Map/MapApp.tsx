"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";

// Leaflet requires window, so we must disable SSR for the map component
const MapComponent = dynamic(() => import("./MapComponent"), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 dark:bg-[#1c1c1e] text-slate-500">
      <span className="material-symbols-rounded animate-spin text-4xl mb-4 text-green-500">sync</span>
      <p className="font-medium animate-pulse">Initializing Map Engine...</p>
    </div>
  )
});

export default function MapApp() {
  return (
    <div className="w-full h-full relative rounded-b-xl overflow-hidden bg-slate-50 dark:bg-[#1c1c1e]">
      <MapComponent />
    </div>
  );
}
