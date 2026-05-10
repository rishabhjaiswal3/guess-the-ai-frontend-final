import { useState, useEffect } from "react";

export function useGraphicsSettings() {
  const [lowGraphics, setLowGraphics] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("lowGraphics") === "true";
  });

  const toggleLowGraphics = () => {
    const newValue = !lowGraphics;
    setLowGraphics(newValue);
    localStorage.setItem("lowGraphics", String(newValue));
    // Trigger custom event for other components
    window.dispatchEvent(new Event("graphicsSettingsChange"));
  };

  useEffect(() => {
    const handleEvent = () => {
      setLowGraphics(localStorage.getItem("lowGraphics") === "true");
    };
    window.addEventListener("graphicsSettingsChange", handleEvent);
    return () => window.removeEventListener("graphicsSettingsChange", handleEvent);
  }, []);

  return { lowGraphics, toggleLowGraphics };
}
