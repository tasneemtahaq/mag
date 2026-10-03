import Link from "next/link";
import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";

export function Hero() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative isolate flex min-h-[calc(100svh-4rem)] items-center overflow-hidden bg-linen lg:min-h-[calc(100svh-5rem)]"
    >
      {/* Static backdrop: a soft spotlight on a white gallery wall.
          In Phase 7 the 3D scene mounts here, and this stays as the
          fallback for mobile and reduced-motion visitors. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_55%_at_50%_0%,#ffffff,transparent_75%)]"
      />

      <Container size="narrow" className="py-24 text-center">
        <p className="mb-6 text-xs font-medium uppercase tracking-[0.3em] text-gold-deep">
          Online Gallery
        </p>
        <h1
          id="hero-heading"
          className="font-display text-5xl font-light leading-[1.05] sm:text-7xl lg:text-8xl"
        >
          Mohammadi Art Gallery
        </h1>
        <p className="mx-auto mt-8 max-w-xl text-lg leading-relaxed text-muted-foreground">
          A contemporary space for collecting original artwork, prints,
          calligraphy and more.
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

      <div
        aria-hidden
        className="absolute inset-x-10 bottom-8 hidden flex-col items-center gap-3 text-[0.65rem] uppercase tracking-[0.3em] text-muted-foreground sm:flex"
      >
        <span>Scroll</span>
        <span className="h-12iqqas w-px bg-gold" />
      </div>
    </section>
  );
}