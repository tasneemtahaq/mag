import { cn } from "@/lib/utils";

// A stand-in for artwork photos until real images exist (Phase 10).
export function ArtworkPlaceholder({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "relative overflow-hidden bg-linear-to-br from-beige to-linen",
        className,
      )}
    >
      <div className="absolute inset-5 border border-gold/40 transition-transform duration-500 group-hover:scale-[0.97]" />
    </div>
  );
}