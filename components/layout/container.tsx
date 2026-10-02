import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const sizes = {
  narrow: "max-w-3xl",
  default: "max-w-6xl",
  wide: "max-w-[90rem]",
} as const;

type ContainerProps = ComponentProps<"div"> & {
  size?: keyof typeof sizes;
};

export function Container({
  size = "default",
  className,
  ...props
}: ContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-6 sm:px-8 lg:px-12",
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}