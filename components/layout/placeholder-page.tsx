import { Container } from "@/components/layout/container";
import { SectionHeading } from "@/components/layout/section-heading";

export function PlaceholderPage({ title }: { title: string }) {
  return (
    <Container size="narrow" className="py-24 sm:py-32">
      <SectionHeading
        as="h1"
        eyebrow="Coming soon"
        title={title}
        description="This page is being prepared and will be available soon."
      />
    </Container>
  );
}