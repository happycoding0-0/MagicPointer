"use client";

import FileExplorerApp from "./FileExplorer/FileExplorerApp";
import NotesApp from "./Notes/NotesApp";
import WelcomeApp from "./Welcome/WelcomeApp";
import SettingsApp from "./Settings/SettingsApp";
import MessengerApp from "./Messenger/MessengerApp";
import MediaApp from "./Media/MediaApp";
import NewsApp from "./News/NewsApp";
import StockApp from "./Stock/StockApp";
import MapApp from "./Map/MapApp";
import BrowserApp from "./Browser/BrowserApp";

export default function AppRouter({ appId }: { appId: string }) {
  switch (appId) {
    case "explorer":
      return <FileExplorerApp />;
    case "browser":
      return <BrowserApp />;
    case "notes":
      return <NotesApp />;
    case "welcome":
      return <WelcomeApp />;
    case "settings":
      return <SettingsApp />;
    case "messenger":
      return <MessengerApp />;
    case "media":
      return <MediaApp />;
    case "news":
      return <NewsApp />;
    case "stock":
      return <StockApp />;
    case "map":
      return <MapApp />;
    default:
      return (
        <div className="w-full h-full flex flex-col items-center justify-center text-white/30 text-sm">
          <span className="material-symbols-rounded text-6xl mb-4 opacity-30">construction</span>
          <p>Real functionality for <strong className="text-white/60">"{appId}"</strong> is under construction.</p>
        </div>
      );
  }
}
