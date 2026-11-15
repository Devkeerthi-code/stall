"use client";

import { useSyncExternalStore } from "react";

const KEY = "stall-theme";

function subscribe(callback: () => void) {
  window.addEventListener("stall-theme", callback);
  return () => window.removeEventListener("stall-theme", callback);
}

const getTheme = () => (document.documentElement.dataset.theme === "dark" ? "dark" : "light");

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getTheme, () => "light");

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    if (next === "dark") document.documentElement.dataset.theme = "dark";
    else delete document.documentElement.dataset.theme;
    try { localStorage.setItem(KEY, next); } catch { /* private mode: still switches for this visit */ }
    window.dispatchEvent(new Event("stall-theme"));
  }

  return (
    <button className="theme-toggle" type="button" onClick={toggle} aria-pressed={theme === "dark"}>
      <span className="theme-toggle__dot" aria-hidden="true" />
      <span>{theme === "dark" ? "Dark" : "Light"}</span>
      <span className="sr-only"> theme, switch</span>
    </button>
  );
}
