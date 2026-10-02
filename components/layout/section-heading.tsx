import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  as?: "h1" | "h2";
  className?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  as: Tag = "h2",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {eyebrow && (
        <p className="mb-4 text-xs font-medium uppercase tracking-[0.3em] text-gold-deep">
          {eyebrow}
        </p>
      )}
      <Tag className="font-display text-4xl font-light leading-tight sm:text-5xl">
        {title}
      </Tag>
      {description && (
        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  );
}