import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

export function GalleryLoading({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex h-full min-h-[calc(100svh-4rem)] flex-col items-center justify-center bg-[#2b130c] px-6 text-center text-ivory lg:min-h-[calc(100svh-5rem)]",
        className,
      )}
    >
      <p className="font-sans text-2xl font-bold uppercase tracking-[0.3em] sm:text-3xl">
        {siteConfig.name}
      </p>
      <p className="mt-4 text-xs uppercase tracking-[0.3em] text-ivory/70">
        Entering the gallery&hellip;
      </p>
      <span aria-hidden className="mt-8 h-px w-24 animate-pulse bg-gold" />
    </div>
  );
}