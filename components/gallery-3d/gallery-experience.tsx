"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { GalleryLoading } from "@/components/gallery-3d/gallery-loading";
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
  // Scroll progress, 0 to 1. A ref (not state), so scrolling never re-renders React.
  const progress = useRef(0);

  const [ready, setReady] = useState(false);
  const [onScreen, setOnScreen] = useState(true);

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

      // Intro text fades out during the first 12% of the journey
      if (introRef.current) {
        introRef.current.style.opacity = String(1 - Math.min(p / 0.12, 1));
      }
      // The closing call-to-action fades in during the last 10%
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
      <div
        ref={stageRef}
        className="sticky top-16 h-[calc(100svh-4rem)] overflow-hidden bg-linen lg:top-20 lg:h-[calc(100svh-5rem)]"
      >
        {/* The 3D canvas */}
        <div
          role="img"
          aria-label="An animated 3D tour through a white, contemporary art gallery"
          className="absolute inset-0"
        >
          <Canvas
            frameloop={onScreen ? "always" : "never"}
            dpr={[1, 1.5]}
            camera={{ fov: 50, near: 0.1, far: 120, position: [0, 1.8, 18] }}
            gl={{ antialias: true, powerPreference: "high-performance" }}
            onCreated={() => setReady(true)}
          >
            <GalleryScene progress={progress} />
          </Canvas>
        </div>

        {/* Intro text (fades out as the camera moves) */}
        <div
          ref={introRef}
          className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center bg-[radial-gradient(ellipse_55%_45%_at_50%_28%,rgba(244,241,234,0.9),transparent_72%)] px-6 pt-[9vh] text-center"
        >
          <p className="mb-5 text-xs font-medium uppercase tracking-[0.3em] text-gold-deep">
            {siteConfig.hero.eyebrow}
          </p>
          <h1 className="font-display text-5xl font-light leading-[1.05] lg:text-7xl">
            {siteConfig.hero.title}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            {siteConfig.hero.description}
          </p>
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-8 flex flex-col items-center gap-3 text-[0.65rem] uppercase tracking-[0.3em] text-muted-foreground"
          >
            <span>Scroll to enter</span>
            <span className="h-12 w-px bg-gold" />
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

        {/* Loading screen, fades away once the 3D scene is ready */}
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