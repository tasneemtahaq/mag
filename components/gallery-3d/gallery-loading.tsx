import { cn } from "@/lib/utils";

export function GalleryLoading({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex h-full min-h-[calc(100svh-4rem)] flex-col items-center justify-center bg-ivory px-6 text-center lg:min-h-[calc(100svh-5rem)]",
        className,
      )}
    >
      <p className="font-display text-2xl font-light uppercase tracking-[0.3em] sm:text-3xl">
        Mohammadi Art Gallery
      </p>
      <p className="mt-4 text-xs uppercase tracking-[0.3em] text-muted-foreground">
        Entering the gallery&hellip;
      </p>
      <span aria-hidden className="mt-8 h-px w-24 animate-pulse bg-gold" />
    </div>
  );
}