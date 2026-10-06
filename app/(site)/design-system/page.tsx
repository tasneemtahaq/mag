import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { SectionHeading } from "@/components/layout/section-heading";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Design system",
  robots: { index: false, follow: false },
};

const swatches = [
  { name: "Ink", hex: "#0F0F0F", className: "bg-ink" },
  { name: "Charcoal", hex: "#2B2A28", className: "bg-charcoal" },
  { name: "Ivory", hex: "#FBF9F4", className: "bg-ivory" },
  { name: "Linen (off-white)", hex: "#F4F1EA", className: "bg-linen" },
  { name: "Beige", hex: "#E8E0D2", className: "bg-beige" },
  { name: "Gold (decorative)", hex: "#B08D57", className: "bg-gold" },
  { name: "Gold deep (text)", hex: "#856739", className: "bg-gold-deep" },
];

export default function DesignSystemPage() {
  return (
   <div className="py-24">
      <Container className="space-y-24">
        <SectionHeading
          as="h1"
          eyebrow="Internal"
          title="Design system"
          description="Colors, typography and controls for Muhammadi Art Gallery. This page is temporary."
        />

        <section aria-labelledby="colors">
          <h2 id="colors" className="mb-8 text-3xl font-light">
            Colors
          </h2>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {swatches.map((s) => (
              <li key={s.name}>
                <div className={`h-24 border border-border ${s.className}`} />
                <p className="mt-3 text-sm font-medium">{s.name}</p>
                <p className="text-sm text-muted-foreground">{s.hex}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="type">
          <h2 id="type" className="mb-8 text-3xl font-light">
            Typography
          </h2>
          <div className="space-y-6">
            <p className="font-display text-6xl font-light">Whispers of Lahore</p>
            <p className="font-display text-3xl">Golden Horizon</p>
            <p className="max-w-xl text-lg leading-relaxed">
              Body text is set in Jost. Each piece is accompanied by a
              certificate of authenticity and is shipped insured across
              Pakistan.
            </p>
            <p className="text-sm text-muted-foreground">
              Small supporting text, such as dimensions or medium.
            </p>
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-gold-deep">
              Eyebrow label
            </p>
          </div>
        </section>

        <section aria-labelledby="buttons">
          <h2 id="buttons" className="mb-8 text-3xl font-light">
            Buttons
          </h2>
          <div className="flex flex-wrap gap-4">
            <Button>Add to cart</Button>
            <Button variant="secondary">Add to wishlist</Button>
            <Button variant="outline">View details</Button>
            <Button variant="ghost">Cancel</Button>
          </div>
        </section>
      </Container>
    </div>
  );
}