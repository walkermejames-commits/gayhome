"use client";

const SAFE_EXIT_URL = "https://www.bbc.co.uk/weather";

export function SafeExitButton() {
  return <button className="safe-exit" type="button" onClick={() => window.location.replace(SAFE_EXIT_URL)} aria-label="Quickly leave this site and open a neutral weather page">Quick exit</button>;
}
