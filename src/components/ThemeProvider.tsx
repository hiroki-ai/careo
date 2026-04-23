"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

export type ColorMode = "light" | "dark" | "auto";
export type FontStyle = "default" | "sans" | "system" | "dyslexic";

export interface ThemeSettings {
  colorMode: ColorMode;
  fontStyle: FontStyle;
  animationsEnabled: boolean;
}

const defaultSettings: ThemeSettings = {
  colorMode: "light",
  fontStyle: "default",
  animationsEnabled: true,
};

interface ThemeContextType {
  settings: ThemeSettings;
  updateSettings: (patch: Partial<ThemeSettings>) => void;
  resolvedDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  settings: defaultSettings,
  updateSettings: () => {},
  resolvedDark: false,
});

export function useTheme() {
  return useContext(ThemeContext);
}

const STORAGE_KEY = "careo_theme";

function loadSettings(): ThemeSettings {
  if (typeof window === "undefined") return defaultSettings;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSettings;
    return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {
    return defaultSettings;
  }
}

const FONT_CLASSES: Record<FontStyle, string> = {
  default: "",
  sans: "theme-font-sans",
  system: "theme-font-system",
  dyslexic: "theme-font-dyslexic",
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<ThemeSettings>(defaultSettings);
  const [systemDark, setSystemDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Load persisted settings on mount
  useEffect(() => {
    setSettings(loadSettings());
    setMounted(true);
    // Check system preference
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemDark(mq.matches);
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // ダークモード廃止: 常に light を強制
  const resolvedDark = false;
  void systemDark;

  // Apply dark class and font class to <html>
  useEffect(() => {
    if (!mounted) return;
    const html = document.documentElement;

    // Dark mode は無効化（LP統一デザインのため）
    html.classList.remove("dark");

    // Font style
    Object.values(FONT_CLASSES).forEach((cls) => {
      if (cls) html.classList.remove(cls);
    });
    const fontClass = FONT_CLASSES[settings.fontStyle];
    if (fontClass) html.classList.add(fontClass);

    // Animations
    if (!settings.animationsEnabled) {
      html.classList.add("reduce-motion");
    } else {
      html.classList.remove("reduce-motion");
    }
  }, [resolvedDark, settings.fontStyle, settings.animationsEnabled, mounted]);

  const updateSettings = useCallback((patch: Partial<ThemeSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // storage full — ignore
      }
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ settings, updateSettings, resolvedDark }}>
      {children}
    </ThemeContext.Provider>
  );
}
