"use client";
import { useEffect, useState } from "react";
import { Download } from "lucide-react";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    });
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShow(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 bg-black text-white p-4 rounded-xl shadow-2xl flex items-center justify-between z-50 animate-bounce">
      <div>
        <p className="font-bold text-lg">Install App</p>
        <p className="text-xs text-gray-400">Fast & Works Offline</p>
      </div>
      <button 
        onClick={handleInstall}
        className="bg-white text-black px-4 py-2 rounded-lg font-bold flex items-center gap-2"
      >
        <Download size={18}/> Download
      </button>
    </div>
  );
}