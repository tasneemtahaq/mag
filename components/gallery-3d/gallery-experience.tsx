"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { NeutralToneMapping } from "three";
import { FrostedDoor } from "@/components/gallery-3d/frosted-door";
import { GalleryLoading } from "@/components/gallery-3d/gallery-loading";
import {
  DOOR_END,
  DOOR_START,
  START_FOV,
  smoothstep,
} from "@/components/gallery-3d/gallery-layout";
import { GalleryScene } from "@/components/gallery-3d/gallery-scene";
import { buttonVariants } from "@/components/ui/button";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

// A default export is required here, because next/dynamic loads it.
// "lite" is the lighter version used on phones and tablets.
export default function GalleryExperience({ lite = false }: { lite?: boolean }) {
  const trackRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const doorRef = useRef<HTMLDivElement>(null);
  const outroRef = useRef<HTMLDivElement>(null);
  // Scroll progress, 0 to 1. A ref (not state), so scrolling never re-renders React.
  const progress = useRef(0);

  const [ready, setReady] = useState(false);
  const [onScreen, setOnScreen] = useState(true);
  const [contextLost, setContextLost] = useState(false);
  const handleReady = useCallback(() => setReady(true), []);

  // Turn the scroll position into a 0-to-1 progress value, and slide the door
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

      // The frosted door (with its heading) slides to the right, like a sliding door
      const door = doorRef.current;
      if (door) {
        const open = smoothstep(DOOR_START, DOOR_END, p);
        door.style.transform = `translate3d(${(open * 104).toFixed(2)}%, 0, 0)`;
        door.style.visibility = open >= 1 ? "hidden" : "visible";
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

  // If the device runs out of graphics memory, the error boundary above us
  // swaps in the normal hero instead of leaving a frozen screen
  if (contextLost) throw new Error("The graphics context was lost.");

  return (
    <section
      ref={trackRef}
      aria-label="Gallery tour"
      className={cn("relative", lite ? "h-[420svh]" : "h-[500svh]")}
    >
      <div
        ref={stageRef}
        className="sticky top-16 h-[calc(100svh-4rem)] overflow-hidden bg-[#2b130c] lg:top-20 lg:h-[calc(100svh-5rem)]"
      >
        {/* The page's one main heading, for screen readers and search engines */}
        <h1 className="sr-only">{siteConfig.hero.title}</h1>

        {/* The 3D canvas */}
        <div
          role="img"
          aria-label="An animated 3D tour: a frosted glass door slides open onto a long terracotta art gallery lit by track lighting"
          className="absolute inset-0"
        >
          <Canvas
            frameloop={onScreen ? "always" : "never"}
            dpr={lite ? [1, 1.25] : [1, 1.5]}
            // Lets a finger scroll the page when it starts on the canvas
            style={{ touchAction: "pan-y" }}
            camera={{ fov: START_FOV, near: 0.1, far: 150, position: [0, 1.65, 4.5] }}
            gl={{
              antialias: true,
              alpha: true,
              powerPreference: "high-performance",
              // Keeps colours true instead of washing them out
              toneMapping: NeutralToneMapping,
            }}
            onCreated={({ gl }) => {
              gl.domElement.addEventListener(
                "webglcontextlost",
                (event) => {
                  event.preventDefault();
                  setContextLost(true);
                },
                { once: true },
              );
            }}
          >
            <GalleryScene
              progress={progress}
              onReady={handleReady}
              lite={lite}
            />
          </Canvas>
        </div>

        {/* The frosted door: slides to the right as you scroll */}
        <FrostedDoor
          doorRef={doorRef}
          title={siteConfig.hero.title}
          eyebrow={siteConfig.hero.eyebrow}
          description={siteConfig.hero.description}
          hint={lite ? "Swipe up to open the door" : "Scroll to open the door"}
        />

        {/* Closing call-to-action (fades in at the end) */}
        <div
          ref={outroRef}
          style={{ opacity: 0, visibility: "hidden" }}
          className="absolute inset-x-0 bottom-0 z-10 flex justify-center bg-linear-to-t from-black/60 to-transparent px-6 pb-12 pt-32"
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