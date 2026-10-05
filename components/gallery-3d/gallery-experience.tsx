"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { NeutralToneMapping } from "three";
import { GalleryLoading } from "@/components/gallery-3d/gallery-loading";
import { START_FOV } from "@/components/gallery-3d/gallery-layout";
import { GalleryScene } from "@/components/gallery-3d/gallery-scene";
import { buttonVariants } from "@/components/ui/button";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

// A default export is required here, because next/dynamic loads it.
export default function GalleryExperience() {
  const trackRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const outroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  // Scroll progress, 0 to 1. A ref (not state), so scrolling never re-renders React.
  const progress = useRef(0);

  const [ready, setReady] = useState(false);
  const [onScreen, setOnScreen] = useState(true);
  const handleReady = useCallback(() => setReady(true), []);

  // Turn the scroll position into a 0-to-1 progress value
  useEffect(() => {
    const track = trackRef.current;
    const stage = stageRef.current;
    if (!track || !stage) return;

    const update = () => {
      const stickyTop = parseFloat(getComputedStyle(stage).top) || 0;
      const scrollable = track.offsetHeight - stage.offsetHeight;
      const raw = (stickyTop - track.getBoundingClientRect().top) / scrollable;
      const p = Math.min(Math.max(raw, 0), 1);
      progress.current = p;

      // The title fades out as the doors begin to open
      if (introRef.current) {
        introRef.current.style.opacity = String(1 - Math.min(p / 0.1, 1));
      }
      // The closing call-to-action fades in at the very end
      if (outroRef.current) {
        const o = Math.min(Math.max((p - 0.9) / 0.1, 0), 1);
        outroRef.current.style.opacity = String(o);
        outroRef.current.style.visibility = o > 0 ? "visible" : "hidden";
      }
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  // Stop drawing 3D frames while the gallery is off-screen
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const observer = new IntersectionObserver(([entry]) =>
      setOnScreen(entry.isIntersecting),
    );
    observer.observe(track);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={trackRef}
      aria-label="Gallery tour"
      className="relative h-[500svh]"
    >
      {/* The stage has a pastel sky; the 3D canvas is transparent on top of it */}
      <div
        ref={stageRef}
        className="sticky top-16 h-[calc(100svh-4rem)] overflow-hidden bg-linear-to-b from-[#bcd9ee] via-[#f4dde8] to-[#fbeee0] lg:top-20 lg:h-[calc(100svh-5rem)]"
      >
        {/* The 3D canvas */}
        <div
          role="img"
          aria-label="An animated 3D tour: a pastel graffiti wall, its doors opening onto a white contemporary art gallery"
          className="absolute inset-0"
        >
          <Canvas
            frameloop={onScreen ? "always" : "never"}
            dpr={[1, 1.5]}
            camera={{ fov: START_FOV, near: 0.1, far: 150, position: [0, 1.7, 15] }}
            gl={{
              antialias: true,
              alpha: true,
              powerPreference: "high-performance",
              // Keeps your artwork's colors true instead of washing them out
              toneMapping: NeutralToneMapping,
            }}
          >
            <GalleryScene
              progress={progress}
              onReady={handleReady}
              titleRef={titleRef}
            />
          </Canvas>
        </div>

                {/* Title above the door (fades out as the doors open) */}
        <div
          ref={introRef}
          className="pointer-events-none absolute inset-0 z-10"
        >
          {/* This block is pinned to the wall above the door, in 3D space */}
          <div
            ref={titleRef}
            className="absolute inset-x-0 top-[31%] -translate-y-1/2 px-6 text-center"
          >
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-ink/80">
              {siteConfig.hero.eyebrow}
            </p>
            <h1 className="whitespace-nowrap font-display text-[clamp(2.25rem,5vw,4.75rem)] font-bold leading-none tracking-tight text-ink [text-shadow:0_2px_24px_rgba(255,255,255,0.9)]">
              {siteConfig.hero.title}
            </h1>
          </div>
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-8 flex flex-col items-center gap-3 text-[0.65rem] uppercase tracking-[0.3em] text-ink/70"
          >
            <span>Scroll to enter</span>
            <span className="h-12 w-px bg-ink/50" />
          </div>
        </div>

        {/* Closing call-to-action (fades in at the end) */}
        <div
          ref={outroRef}
          style={{ opacity: 0, visibility: "hidden" }}
          className="absolute inset-x-0 bottom-0 z-10 flex justify-center bg-linear-to-t from-ink/60 to-transparent px-6 pb-12 pt-32"
        >
          <Link href="/shop" className={buttonVariants({ size: "lg" })}>
            Explore the collection
          </Link>
        </div>

        {/* Loading screen, fades away once everything is loaded */}
        <div
          className={cn(
            "absolute inset-0 z-30 transition-opacity duration-700",
            ready ? "pointer-events-none opacity-0" : "opacity-100",
          )}
        >
          <GalleryLoading />
        </div>
      </div>
    </section>
  );
}