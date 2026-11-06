"use client";

import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";

type HeadingArt = {
  mask: string;
  overlay: string;
  // Where the tops of the capital letters sit (px from the top),
  // so the small label and the handle can stay clear of the heading
  headingTop: number;
};

// How many letters at the END of each line stick out past the glass as solid white
const SOLID_LETTERS = 4;

// ----- Readability settings (all as a share of the font size unless noted) -----
// A little extra space between letters, so hollow letters don't blur together
const LETTER_SPACING = 0.05;
// Darkens the 3D scene seen THROUGH the letters, so they read as clear shapes
const INNER_TINT = 0.28; // 0 = no tint, 1 = black
// Cut-glass look (no outline): a shadow falls into each letter from its top edge,
// and a faint light catches its bottom edge, like a real cut in thick glass
const BEVEL_SHADOW_COLOR = "rgba(0,0,0,0.7)";
const BEVEL_SHADOW_BLUR = 0.07;
const BEVEL_SHADOW_DEPTH = 0.035; // how far the shadow reaches down into the letter
const BEVEL_LIGHT_COLOR = "rgba(255,255,255,0.45)";
const BEVEL_LIGHT_BLUR = 0.03;
const BEVEL_LIGHT_DEPTH = 0.012; // how far the light reaches up into the letter
// Soft dark shadow on the glass just OUTSIDE the letters, so they look carved in
const EDGE_SHADOW_BLUR = 0.05;
const EDGE_SHADOW_COLOR = "rgba(0,0,0,0.35)";

function makeCanvas(width: number, height: number, dpr: number) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * dpr));
  canvas.height = Math.max(1, Math.round(height * dpr));
  const ctx = canvas.getContext("2d");
  if (ctx) ctx.scale(dpr, dpr);
  return { canvas, ctx };
}

// Draws the heading into two images:
//  - a MASK for the frosted glass: solid, with the hollow letters cut out,
//    so the sharp 3D scene shows through them
//  - an OVERLAY: the solid white letters that stick out past the glass,
//    plus everything that makes the hollow letters easy to read
//    (dark tint inside, glow + outline on the edge, shadow around them)
function renderHeading({
  width,
  height,
  panelWidth,
  portrait,
  family,
  line1,
  line2,
}: {
  width: number; // the whole door
  height: number;
  panelWidth: number; // the real width of the glass, measured from the page
  portrait: boolean;
  family: string;
  line1: string;
  line2: string;
}): HeadingArt | null {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  const setup = (ctx: CanvasRenderingContext2D, size: number) => {
    ctx.font = `700 ${size}px ${family}`;
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";
    ctx.letterSpacing = `${size * LETTER_SPACING}px`;
  };

  // Landscape: the first letters are hollow and the last few stick out in white.
  // Portrait (a phone): only a sliver is left outside the glass, so every
  // letter is hollow and the whole heading fits on the glass.
  const cut = (line: string) =>
    portrait ? line : line.slice(0, Math.max(1, line.length - SOLID_LETTERS));
  const prefix1 = cut(line1);
  const prefix2 = cut(line2);
  const suffix1 = line1.slice(prefix1.length);
  const suffix2 = line2.slice(prefix2.length);

  // ----- Work out the font size -----
  const { ctx: measure } = makeCanvas(1, 1, 1);
  if (!measure) return null;
  setup(measure, 100);
  const unit = (text: string) => measure.measureText(text).width / 100;

  const leftMargin = panelWidth * (portrait ? 0.08 : 0.06);
  const limits = [
    (panelWidth - leftMargin) / Math.max(unit(prefix1), unit(prefix2)),
    height * (portrait ? 0.1 : 0.16),
  ];
  if (!portrait && suffix1 && suffix2) {
    limits.push(
      ((width - panelWidth) * 0.94) / Math.max(unit(suffix1), unit(suffix2)),
    );
  }
  const size = Math.min(...limits);

  // ----- Place the lines -----
  setup(measure, size);
  // Landscape: each hollow part ENDS exactly at the glass edge, where the solid part begins
  const x1 = portrait ? leftMargin : panelWidth - measure.measureText(prefix1).width;
  const x2 = portrait ? leftMargin : panelWidth - measure.measureText(prefix2).width;

  // Centre the two lines using the real height of capital letters
  const capHeight =
    measure.measureText("M").actualBoundingBoxAscent || size * 0.72;
  const lineGap = size * 1.1;
  const headingTop = (height - (capHeight + lineGap)) / 2;
  const y1 = headingTop + capHeight;
  const y2 = y1 + lineGap;

  // Draws both hollow parts with whatever style is currently set
  const fillHollow = (ctx: CanvasRenderingContext2D) => {
    ctx.fillText(prefix1, x1, y1);
    ctx.fillText(prefix2, x2, y2);
  };

  // ----- 1. The mask for the glass -----
  const glass = makeCanvas(panelWidth, height, dpr);
  if (!glass.ctx) return null;
  glass.ctx.fillStyle = "#000";
  glass.ctx.fillRect(0, 0, panelWidth, height);
  glass.ctx.globalCompositeOperation = "destination-out";
  setup(glass.ctx, size);
  fillHollow(glass.ctx);

  // ----- 2. A soft shadow on the glass, just OUTSIDE the letters -----
  // Gives each letter a carved-in edge, so it separates from the bright frost
  const edge = makeCanvas(panelWidth, height, dpr);
  if (!edge.ctx) return null;
  setup(edge.ctx, size);
  edge.ctx.fillStyle = "#000";
  edge.ctx.shadowColor = EDGE_SHADOW_COLOR;
  edge.ctx.shadowBlur = size * EDGE_SHADOW_BLUR * dpr;
  edge.ctx.shadowOffsetY = size * 0.01 * dpr;
  fillHollow(edge.ctx);
  // Remove the letters themselves, leaving only the shadow around them
  edge.ctx.shadowColor = "transparent";
  edge.ctx.globalCompositeOperation = "destination-out";
  fillHollow(edge.ctx);

  // ----- 3. Inside the hollow letters: dark tint + cut-glass bevel -----
  // A "frame": solid everywhere EXCEPT the letters. Casting a shadow from it
  // is what makes the shadow fall INTO the letters from their edges.
  const frame = makeCanvas(panelWidth, height, dpr);
  if (!frame.ctx) return null;
  setup(frame.ctx, size);
  frame.ctx.fillStyle = "#000";
  frame.ctx.fillRect(0, 0, panelWidth, height);
  frame.ctx.globalCompositeOperation = "destination-out";
  fillHollow(frame.ctx);

  const inner = makeCanvas(panelWidth, height, dpr);
  if (!inner.ctx) return null;
  setup(inner.ctx, size);

  // A. Darken the scene a little, so busy colours don't swallow the letters
  inner.ctx.fillStyle = `rgba(0,0,0,${INNER_TINT})`;
  fillHollow(inner.ctx);

  // B. Shadow falling in from the TOP edge of each letter
  inner.ctx.save();
  inner.ctx.shadowColor = BEVEL_SHADOW_COLOR;
  inner.ctx.shadowBlur = size * BEVEL_SHADOW_BLUR * dpr;
  inner.ctx.shadowOffsetY = size * BEVEL_SHADOW_DEPTH * dpr;
  inner.ctx.drawImage(frame.canvas, 0, 0, panelWidth, height);
  inner.ctx.restore();

  // C. Faint light catching the BOTTOM edge of each letter
  inner.ctx.save();
  inner.ctx.shadowColor = BEVEL_LIGHT_COLOR;
  inner.ctx.shadowBlur = size * BEVEL_LIGHT_BLUR * dpr;
  inner.ctx.shadowOffsetY = -size * BEVEL_LIGHT_DEPTH * dpr;
  inner.ctx.globalCompositeOperation = "lighter";
  inner.ctx.drawImage(frame.canvas, 0, 0, panelWidth, height);
  inner.ctx.restore();

  // D. Keep everything only inside the letter shapes
  // (this also removes the solid frame itself, leaving just its shadows)
  inner.ctx.globalCompositeOperation = "destination-in";
  inner.ctx.fillStyle = "#fff";
  fillHollow(inner.ctx);

  // ----- 4. The overlay: solid white letters + all the hollow-letter layers -----
  const overlay = makeCanvas(width, height, dpr);
  if (!overlay.ctx) return null;
  setup(overlay.ctx, size);

  if (!portrait) {
    // Past the glass edge: the complete lines, so the letters keep their exact
    // spacing, but only the part outside the glass is shown
    overlay.ctx.save();
    overlay.ctx.beginPath();
    overlay.ctx.rect(panelWidth, 0, width - panelWidth, height);
    overlay.ctx.clip();
    overlay.ctx.fillStyle = "#ffffff";
    overlay.ctx.shadowColor = "rgba(0,0,0,0.35)";
    overlay.ctx.shadowBlur = size * 0.04 * dpr;
    overlay.ctx.fillText(line1, x1, y1);
    overlay.ctx.fillText(line2, x2, y2);
    overlay.ctx.restore();
  }

  overlay.ctx.drawImage(edge.canvas, 0, 0, panelWidth, height);
  overlay.ctx.drawImage(inner.canvas, 0, 0, panelWidth, height);

  return {
    mask: glass.canvas.toDataURL("image/png"),
    overlay: overlay.canvas.toDataURL("image/png"),
    headingTop,
  };
}

export function FrostedDoor({
  doorRef,
  title,
  eyebrow,
  description,
  hint,
}: {
  doorRef: RefObject<HTMLDivElement | null>;
  title: string;
  eyebrow: string;
  description: string;
  hint: string;
}) {
  const fontRef = useRef<HTMLSpanElement>(null);
  const glassRef = useRef<HTMLDivElement>(null);

  const [art, setArt] = useState<HeadingArt | null>(null);
  // The glass stays hidden until the first drawing attempt, so it never flashes without its cutouts
  const [tried, setTried] = useState(false);

  // "Muhammadi Art Gallery" becomes two lines: MUHAMMADI / ART GALLERY
  const [first, ...rest] = title.toUpperCase().split(" ");
  const line1 = first;
  const line2 = rest.join(" ");

  useEffect(() => {
    const door = doorRef.current;
    const glass = glassRef.current;
    const fontSource = fontRef.current;
    if (!door || !glass || !fontSource) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const build = async () => {
      const family = getComputedStyle(fontSource).fontFamily;

      try {
        await document.fonts.load(`700 100px ${family}`);
        await document.fonts.ready;
      } catch {
        // Use whatever font is available
      }
      if (cancelled) return;

      const width = door.offsetWidth;
      const height = door.offsetHeight;
      // The width of the glass as it really is on the page
      const panelWidth = glass.offsetWidth;
      if (width < 200 || height < 200 || panelWidth < 100) return;

      const result = renderHeading({
        width,
        height,
        panelWidth,
        portrait: window.matchMedia("(orientation: portrait)").matches,
        family,
        line1,
        line2,
      });

      if (!cancelled) {
        setArt(result);
        setTried(true);
      }
    };

    void build();

    // Redraw when the window changes size
    const observer = new ResizeObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(() => void build(), 150);
    });
    observer.observe(door);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [doorRef, line1, line2]);

  // The handle sits in the empty space ABOVE the heading, centred in that gap,
  // and shrinks on short screens so it never touches the letters
  const handleStyle = art
    ? {
        top: art.headingTop / 2,
        height: Math.max(40, Math.min(112, art.headingTop * 0.55)),
      }
    : { top: "14%", height: 112 };

  return (
    <div
      ref={doorRef}
      // --panel is the width of the glass: 64% normally, 90% on a tall phone screen.
      // Everything below uses it, so the glass, handle and lettering always agree.
      className="pointer-events-none absolute inset-0 z-10 will-change-transform [--panel:64%] portrait:[--panel:90%]"
    >
      {/* Used only to find out which font the heading should be drawn in */}
      <span ref={fontRef} aria-hidden className="sr-only font-sans font-bold">
        {title}
      </span>

      {/* The frosted glass, with the hollow letters cut out of it.
          Slightly brighter frost than before, so the cut-out letters stand out more. */}
      <div
        ref={glassRef}
        aria-hidden
        className={`absolute inset-y-0 left-0 w-[var(--panel)] bg-linear-to-br from-white/30 to-white/10 backdrop-blur-[24px] backdrop-saturate-150 transition-opacity duration-300 ${
          tried ? "opacity-100" : "opacity-0"
        }`}
        style={
          art
            ? {
                WebkitMaskImage: `url("${art.mask}")`,
                maskImage: `url("${art.mask}")`,
                WebkitMaskSize: "100% 100%",
                maskSize: "100% 100%",
                WebkitMaskRepeat: "no-repeat",
                maskRepeat: "no-repeat",
              }
            : undefined
        }
      />

      {/* A door handle on the edge of the glass, above the heading */}
      <div
        aria-hidden
        className="absolute left-[calc(var(--panel)-1.25rem)] w-0.75 -translate-y-1/2 rounded-full bg-white/70 shadow-[0_0_6px_rgba(0,0,0,0.25)]"
        style={handleStyle}
      />

      {/* The solid white letters past the glass, and the layers that make the hollow ones readable */}
      {art && (
        <div
          aria-hidden
          className="absolute inset-0 bg-no-repeat"
          style={{
            backgroundImage: `url("${art.overlay}")`,
            backgroundSize: "100% 100%",
          }}
        />
      )}

      {/* The small label sits just above the heading, wherever the heading is */}
      <p
        className="absolute left-[3.5%] text-[0.7rem] font-semibold uppercase tracking-[0.35em] text-white/90 portrait:left-[8%]"
        style={{ top: art ? Math.max(8, art.headingTop - 38) : "27%" }}
      >
        {eyebrow}
      </p>

      {/* The description and the hint */}
      <div className="absolute bottom-[8%] left-[3.5%] w-[42%] space-y-5 portrait:left-[8%] portrait:w-[80%]">
        <p className="text-sm italic leading-relaxed text-white/90">
          {description}
        </p>

        <p className="inline-flex w-fit max-w-full border-b border-white/70 pb-1 text-[0.7rem] uppercase tracking-[0.2em] text-white">
          {hint}
        </p>
      </div>
    </div>
  );
}