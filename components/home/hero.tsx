import Link from "next/link";
import { HeroPoster } from "@/components/home/hero-poster";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

// The two-line heading. It is drawn twice, exactly on top of itself:
// solid white where it sticks out past the frosted glass,
// and an outline where it sits on the glass.
function HeadingLines({
  line1,
  line2,
  className,
}: {
  line1: string;
  line2: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "font-sans text-[12vw] font-bold uppercase leading-[1.04] tracking-[0.03em] lg:text-[8vw]",
        className,
      )}
    >
      <span className="ml-[calc(var(--panel)*0.1)] block whitespace-nowrap lg:ml-[calc(var(--panel)*0.26)]">
        {line1}
      </span>
      <span className="ml-[calc(var(--panel)*0.07)] block whitespace-nowrap lg:ml-[calc(var(--panel)*0.05)]">
        {line2}
      </span>
    </div>
  );
}

export function Hero() {
  const { hero } = siteConfig;
  const [first, ...rest] = hero.title.toUpperCase().split(" ");
  const line1 = first;
  const line2 = rest.join(" ");

  return (
    <section
      aria-labelledby="hero-heading"
      className="relative isolate min-h-[calc(100svh-4rem)] overflow-hidden bg-[#2b130c] text-white [--panel:92%] lg:min-h-[calc(100svh-5rem)] lg:[--panel:58%]"
    >
      <HeroPoster />

      {/* The frosted glass */}
      <div
        aria-hidden
        className="absolute inset-y-0 left-0 w-[92%] border-r border-white/40 bg-linear-to-br from-white/25 to-white/5 backdrop-blur-[20px] backdrop-saturate-150 lg:w-[58%]"
      />

      <h1 id="hero-heading" className="sr-only">
        {hero.title}
      </h1>

      <div className="relative z-10 flex min-h-[calc(100svh-4rem)] flex-col justify-center py-20 lg:min-h-[calc(100svh-5rem)]">
        <p className="mb-6 ml-[calc(var(--panel)*0.07)] text-[0.7rem] font-semibold uppercase tracking-[0.35em] text-white/90 lg:ml-[calc(var(--panel)*0.06)]">
          {hero.eyebrow}
        </p>

        <div aria-hidden className="relative w-full">
          <HeadingLines
            line1={line1}
            line2={line2}
            className="text-white [clip-path:inset(0_0_0_var(--panel))]"
          />
          <HeadingLines
            line1={line1}
            line2={line2}
            className="absolute inset-0 text-transparent [-webkit-text-stroke:1.5px_rgba(255,255,255,0.9)] [clip-path:inset(0_calc(100%-var(--panel))_0_0)]"
          />
        </div>

        <div className="mt-10 ml-[calc(var(--panel)*0.07)] max-w-sm space-y-6 lg:ml-[calc(var(--panel)*0.06)]">
          <p className="text-sm italic leading-relaxed text-white/90">
            {hero.description}
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-[0.7rem] uppercase tracking-[0.25em]">
            <Link
              href="/shop"
              className="border-b border-white/70 pb-1 transition-colors hover:border-white"
            >
              Explore the collection
            </Link>
            <Link
              href="/about"
              className="border-b border-white/70 pb-1 transition-colors hover:border-white"
            >
              Our story
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}