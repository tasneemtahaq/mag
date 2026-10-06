"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { GalleryErrorBoundary } from "@/components/gallery-3d/gallery-error-boundary";
import { GalleryLoading } from "@/components/gallery-3d/gallery-loading";
import { useGalleryMode } from "@/components/gallery-3d/use-gallery-mode";

// The heavy 3D code is a separate file. It is downloaded only when this
// component actually renders it, and never on the server.
const GalleryExperience = dynamic(
  () => import("@/components/gallery-3d/gallery-experience"),
  { ssr: false, loading: () => <GalleryLoading /> },
);

export function Gallery3DWrapper({ fallback }: { fallback: ReactNode }) {
  const mode = useGalleryMode();

  if (mode === "full" || mode === "lite") {
    return (
      <GalleryErrorBoundary fallback={fallback}>
        <GalleryExperience lite={mode === "lite"} />
      </GalleryErrorBoundary>
    );
  }

  // "pending" (server and first paint) and "static" (reduced motion,
  // data saver, no WebGL, very weak devices) show the lightweight hero.
  return <>{fallback}</>;
}