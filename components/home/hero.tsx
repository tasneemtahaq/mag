import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";
import { siteConfig } from "@/lib/site-config";

export function Hero() {
  const { hero } = siteConfig;

  return (
    <section
      aria-labelledby="hero-heading"
      className="relative isolate flex min-h-[calc(100svh-4rem)] items-center overflow-hidden bg-ivory lg:min-h-[calc(100svh-5rem)]"
    >
      {/* The pastel graffiti wall. It is decorative, so its alt text is empty. */}
      <Image
        src="/gallery/graffiti-wall.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="-z-10 object-cover"
      />

            <Container className="py-24 text-center">
        <p className="mb-6 text-xs font-medium uppercase tracking-[0.3em] text-ink/70">
          {hero.eyebrow}
        </p>
        <h1
          id="hero-heading"
          className="whitespace-nowrap font-display text-[clamp(1.6rem,6vw,5.5rem)] font-bold leading-[1.05] tracking-tight [text-shadow:0_2px_24px_rgba(255,255,255,0.9)]"
        >
          {hero.title}
        </h1>
        <p className="mx-auto mt-8 max-w-xl text-lg leading-relaxed text-ink/80 [text-shadow:0_1px_16px_rgba(255,255,255,0.9)]">
          {hero.description}
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/shop" className={buttonVariants({ size: "lg" })}>
            Explore the collection
          </Link>
          <Link
            href="/about"
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            Our story
          </Link>
        </div>
      </Container>
    </section>
  );
}