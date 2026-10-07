import type { Metadata } from "next";
import Link from "next/link";
import { signOut } from "@/actions/auth/sign-out";
import { Container } from "@/components/layout/container";
import { SectionHeading } from "@/components/layout/section-heading";
import { Button, buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Account",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const user = await requireUser("/account");

  return (
    <Container size="narrow" className="py-20 sm:py-28">
      <SectionHeading
        as="h1"
        eyebrow="Account"
        title={user.name ? `Welcome, ${user.name}` : "Welcome"}
        description="Your orders, wishlist and saved addresses will appear here as we build them."
      />
      <p className="mt-8 text-sm text-muted-foreground">
        Signed in as {user.email}
      </p>
      <div className="mt-8 flex flex-wrap gap-4">
        {user.role === "ADMIN" && (
          <Link href="/admin" className={buttonVariants()}>
            Open admin
          </Link>
        )}
        <form action={signOut}>
          <Button type="submit" variant="outline">
            Sign out
          </Button>
        </form>
      </div>
    </Container>
  );
}