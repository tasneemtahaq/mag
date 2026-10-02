import { Container } from "@/components/layout/container";

export default function HomePage() {
  return (
    <div className="flex min-h-[70vh] items-center">
      <Container size="narrow" className="py-24 text-center">
        <p className="mb-4 text-xs font-medium uppercase tracking-[0.3em] text-gold-deep">
          Est. in Pakistan
        </p>
        <h1 className="font-display text-5xl font-light sm:text-7xl">
          Mohammadi Art Gallery
        </h1>
        <p className="mx-auto mt-6 max-w-md text-lg text-muted-foreground">
          Our new home for collecting art is being built.
        </p>
      </Container>
    </div>
  );
}