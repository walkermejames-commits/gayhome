"use client";
import { useState } from "react";
import { accessibilityPreferencesSchema, defaultAccessibilityPreferences, type AccessibilityPreferences } from "@/phase6/content";

const storageKey = "navigator_accessibility_preferences_v1";
export function AccessibilityPreferencesForm() {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(defaultAccessibilityPreferences);
  const [saved, setSaved] = useState(false);
  const load = () => { try { const value = sessionStorage.getItem(storageKey); if (!value) return; const parsed=accessibilityPreferencesSchema.safeParse(JSON.parse(value)); if (parsed.success) setPreferences(parsed.data); else sessionStorage.removeItem(storageKey); } catch { sessionStorage.removeItem(storageKey); } };
  const toggle = (key: keyof AccessibilityPreferences) => setPreferences((current) => ({ ...current, [key]: !current[key] }));
  const save = () => { sessionStorage.setItem(storageKey, JSON.stringify(preferences)); document.documentElement.dataset.contrast = preferences.contrast; document.documentElement.dataset.reducedDensity = String(preferences.reducedDensity); setSaved(true); };
  const booleanKeys = Object.keys(preferences).filter((key) => typeof preferences[key as keyof AccessibilityPreferences] === "boolean") as Array<keyof AccessibilityPreferences>;
  return <form className="form-stack" onSubmit={(event) => { event.preventDefault(); save(); }}><p>These guest preferences stay in this browser tab. They contain no diagnosis, profile, case or authentication data and are not shared with organisations.</p><button className="secondary" type="button" onClick={load}>Load saved tab preferences</button><label className="field">Text size<select value={preferences.textSize} onChange={(event) => setPreferences((current) => ({ ...current, textSize: event.target.value as AccessibilityPreferences["textSize"] }))}><option value="default">Default</option><option value="large">Large</option><option value="extra_large">Extra large</option></select></label>{booleanKeys.map((key) => <label key={key}><input type="checkbox" checked={Boolean(preferences[key])} onChange={() => toggle(key)} /> {key.replaceAll(/([A-Z])/g, " $1").replaceAll("_", " ")}</label>)}<button className="primary" type="submit">Save for this tab</button><p role="status" aria-live="polite">{saved ? "Accessibility preferences saved for this tab." : ""}</p></form>;
}
