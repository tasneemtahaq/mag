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

  if (mode === "3d") {
    return (
      <GalleryErrorBoundary fallback={fallback}>
        <GalleryExperience />
      </GalleryErrorBoundary>
    );
  }

  // "pending" (server and first paint) and "static" (phones, reduced motion,
  // no WebGL) both show the lightweight hero.
  return <>{fallback}</>;
}