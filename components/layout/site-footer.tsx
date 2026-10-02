import Link from "next/link";
import type { ReactNode } from "react";
import { Container } from "@/components/layout/container";
import { getFooterCategories } from "@/lib/data/categories";
import { footerNav } from "@/lib/navigation";
import { siteConfig } from "@/lib/site-config";

const linkClass =
  "text-ivory/70 transition-colors hover:text-ivory focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold";

function FooterHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-5 font-sans text-xs font-medium uppercase tracking-[0.3em] text-gold">
      {children}
    </h2>
  );
}

export async function SiteFooter() {
  const categories = await getFooterCategories();
  const { contact, social } = siteConfig;

  return (
    <footer className="bg-ink text-ivory">
      <Container size="wide" className="py-16 lg:py-24">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-6">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-2">
            <p className="font-display text-2xl uppercase tracking-[0.25em]">
              {siteConfig.name}
            </p>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ivory/70">
              {siteConfig.tagline}
            </p>
          </div>

          {/* Gallery */}
          <nav aria-label="Gallery">
            <FooterHeading>Gallery</FooterHeading>
            <ul className="space-y-3 text-sm">
              {footerNav.gallery.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className={linkClass}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Customer */}
          <nav aria-label="Customer">
            <FooterHeading>Customer</FooterHeading>
            <ul className="space-y-3 text-sm">
              {footerNav.customer.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className={linkClass}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Categories (from the database, from Phase 9) */}
          <nav aria-label="Categories">
            <FooterHeading>Categories</FooterHeading>
            {categories.length > 0 ? (
              <ul className="space-y-3 text-sm">
                {categories.map((category) => (
                  <li key={category.slug}>
                    <Link href={`/shop/${category.slug}`} className={linkClass}>
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ivory/60">
                New collections arriving soon.
              </p>
            )}
          </nav>

          {/* Contact */}
          <div>
            <FooterHeading>Contact</FooterHeading>
            <address className="space-y-3 text-sm not-italic text-ivory/70">
              <p>{contact.address}</p>
              <p>
                <a
                  href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`}
                  className={linkClass}
                >
                  {contact.phone}
                </a>
              </p>
              <p>
                <a href={`mailto:${contact.email}`} className={linkClass}>
                  {contact.email}
                </a>
              </p>
            </address>
            {social.length > 0 && (
              <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                {social.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={linkClass}
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 flex flex-col gap-4 border-t border-ivory/15 pt-8 text-sm text-ivory/60 sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {new Date().getFullYear()} {siteConfig.name}. All rights
            reserved.
          </p>
          <nav aria-label="Legal">
            <ul className="flex flex-wrap gap-x-6 gap-y-2">
              {footerNav.legal.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className={linkClass}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </Container>
    </footer>
  );
}