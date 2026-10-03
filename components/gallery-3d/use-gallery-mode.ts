import { useSyncExternalStore } from "react";

export type GalleryMode = "pending" | "3d" | "static";

type ExtendedNavigator = Navigator & {
  connection?: { saveData?: boolean };
  deviceMemory?: number;
};

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    if (!gl) return false;
    // Release the test context so it doesn't count against the browser's limit
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

function canRun3D(): boolean {
  // Visitors who asked their device to reduce motion
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return false;
  }
  // Touch-first devices (phones, tablets) and small screens
  if (window.matchMedia("(pointer: coarse)").matches) return false;
  if (window.innerWidth < 1024) return false;

  const nav = navigator as ExtendedNavigator;
  // Data saver turned on
  if (nav.connection?.saveData) return false;
  // Low-memory or low-core machines (only some browsers report these)
  if (nav.deviceMemory !== undefined && nav.deviceMemory < 4) return false;
  if (
    navigator.hardwareConcurrency !== undefined &&
    navigator.hardwareConcurrency < 4
  ) {
    return false;
  }

  return hasWebGL();
}

// The answer is worked out once and remembered
let cached: GalleryMode | null = null;

function getSnapshot(): GalleryMode {
  if (cached === null) cached = canRun3D() ? "3d" : "static";
  return cached;
}

// On the server, and during hydration, we always answer "pending".
// That keeps the server HTML and the first browser render identical.
function getServerSnapshot(): GalleryMode {
  return "pending";
}

// Re-check if the visitor switches reduced-motion on or off while browsing
function subscribe(onChange: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  const handler = () => {
    cached = null;
    onChange();
  };
  query.addEventListener("change", handler);
  return () => query.removeEventListener("change", handler);
}

export function useGalleryMode(): GalleryMode {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}