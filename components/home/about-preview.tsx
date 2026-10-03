import Link from "next/link";
import { Container } from "@/components/layout/container";
import { SectionHeading } from "@/components/layout/section-heading";
import { ArtworkPlaceholder } from "@/components/products/artwork-placeholder";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// DRAFT COPY: replace with the gallery's own words.
export function AboutPreview() {
  return (
    <section aria-label="About the gallery" className="py-24 sm:py-32">
      <Container className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <ArtworkPlaceholder className="aspect-4/5 w-full" />
        <div>
          <SectionHeading
            eyebrow="Our story"
            title="A home for contemporary art"
            description="Original paintings, fine-art prints, calligraphy and handcrafted work, gathered in one considered space."
          />
          <Link
            href="/about"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "mt-10",
            )}
          >
            Read our story
          </Link>
        </div>
      </Container>
    </section>
  );
}