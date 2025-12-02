import { useState, useEffect } from "react";

const STORAGE_KEY = "tonto-viewer-settings";

export const defaultSettings = {
  autoSaveToDisk: false,
  autoSaveToReparse: true,
  autoSaveDelay: 500,
  onCloseUnsaved: "confirm",
  keepTokenHighlight: false,
  attributeDisplay: "shown", // "shown", "collapsible", "hover"
  showExternalClasses: true, // Show ghost nodes for imported classes
};

export function useSettings() {
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...defaultSettings, ...parsed };
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    }
    return defaultSettings;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error("Failed to save settings:", error);
    }
  }, [settings]);

  const updateSetting = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const updateSettings = (updates) => {
    setSettings((prev) => ({
      ...prev,
      ...updates,
    }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  return {
    settings,
    updateSetting,
    updateSettings,
    resetSettings,
  };
}

export default useSettings;
