import { useSyncExternalStore } from "react";

// "full" = desktop, "lite" = phones and tablets, "static" = the simple hero
export type GalleryMode = "pending" | "full" | "lite" | "static";

type ExtendedNavigator = Navigator & {
  connection?: { saveData?: boolean; effectiveType?: string };
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

function detectMode(): GalleryMode {
  // Visitors who asked their device to reduce motion
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return "static";
  }

  const nav = navigator as ExtendedNavigator;
  // Data saver turned on, or a very slow connection
  if (nav.connection?.saveData) return "static";
  if (
    nav.connection?.effectiveType === "slow-2g" ||
    nav.connection?.effectiveType === "2g"
  ) {
    return "static";
  }

  if (!hasWebGL()) return "static";

  // Only some browsers report memory and cores
  const memory = nav.deviceMemory;
  const cores = navigator.hardwareConcurrency;

  const touchFirst =
    window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 1024;

  if (touchFirst) {
    // Phones and tablets get the lighter version, unless they are very weak
    if (memory !== undefined && memory < 2) return "static";
    if (cores !== undefined && cores < 4) return "static";
    return "lite";
  }

  if (memory !== undefined && memory < 4) return "static";
  if (cores !== undefined && cores < 4) return "static";
  return "full";
}

// The answer is worked out once and remembered
let cached: GalleryMode | null = null;

function getSnapshot(): GalleryMode {
  if (cached === null) cached = detectMode();
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