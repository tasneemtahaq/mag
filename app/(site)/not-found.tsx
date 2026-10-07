import Link from "next/link";
import { Container } from "@/components/layout/container";
import { SectionHeading } from "@/components/layout/section-heading";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <Container size="narrow" className="py-24 sm:py-32">
      <SectionHeading
        as="h1"
        eyebrow="404"
        title="This page could not be found"
        description="The artwork or page you are looking for may have been sold, moved, or never existed."
      />
      <div className="mt-10 flex flex-wrap gap-4">
        <Link href="/shop" className={buttonVariants()}>
          Browse the shop
        </Link>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          Go to the homepage
        </Link>
      </div>
    </Container>
  );
}