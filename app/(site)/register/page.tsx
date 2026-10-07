import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth/register-form";
import { Container } from "@/components/layout/container";
import { SectionHeading } from "@/components/layout/section-heading";
import { safeRedirectPath } from "@/lib/auth/safe-redirect";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Create an account",
  robots: { index: false, follow: false },
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const target = safeRedirectPath(next);

  if (await getSession()) redirect(target);

  return (
    <Container size="narrow" className="py-20 sm:py-28">
      <SectionHeading as="h1" eyebrow="Account" title="Create an account" />
      <div className="mt-10 max-w-md">
        <RegisterForm next={target} />
      </div>
    </Container>
  );
}