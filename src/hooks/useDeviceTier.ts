import { useEffect, useState } from "react";

export type DeviceTier = "low" | "high";

function detectTier(): DeviceTier {
  if (typeof window === "undefined") return "high";
  try {
    const lowCores =
      typeof navigator !== "undefined" &&
      typeof navigator.hardwareConcurrency === "number" &&
      navigator.hardwareConcurrency > 0 &&
      navigator.hardwareConcurrency <= 4;
    const noHover =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(hover: none)").matches;
    const reducedMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // "narrow" (viewport chico) no implica dispositivo lento: puede ser desktop con ventana chica.
    // Low-tier se decide por señales de hardware / input / accesibilidad.
    return lowCores || noHover || reducedMotion ? "low" : "high";
  } catch {
    return "high";
  }
}

// Cache: detectado una sola vez por sesión.
let cached: DeviceTier | null = null;

export function getDeviceTier(): DeviceTier {
  if (cached === null) cached = detectTier();
  return cached;
}

export function useDeviceTier(): DeviceTier {
  const [tier] = useState<DeviceTier>(() => getDeviceTier());
  // Sin listeners: tier estable durante la sesión (evita re-mounts costosos
  // de Canvas si el usuario rota el dispositivo).
  useEffect(() => {}, []);
  return tier;
}

export function isLowTier(): boolean {
  return getDeviceTier() === "low";
}