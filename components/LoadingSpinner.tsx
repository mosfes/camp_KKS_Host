import type { HTMLAttributes } from "react";

type LoadingSpinnerProps = HTMLAttributes<HTMLDivElement> & {
  size?: "sm" | "md" | "lg" | "xl";
  tone?: "default" | "inverse";
};

const sizes = {
  sm: "h-4 w-4 border-2",
  md: "h-8 w-8 border-[3px]",
  lg: "h-10 w-10 border-4",
  xl: "h-14 w-14 border-4",
};

/** Shared loading indicator for pages, panels, and overlays. */
export default function LoadingSpinner({
  size = "lg",
  tone = "default",
  className = "",
  "aria-label": ariaLabel = "กำลังโหลด",
  ...props
}: LoadingSpinnerProps) {
  const colors =
    tone === "inverse"
      ? "border-white/30 border-t-white"
      : "border-[#6b857a]/20 border-t-[#6b857a]";

  return (
    <div
      aria-label={ariaLabel}
      role="status"
      className={`loading-spinner shrink-0 rounded-full animate-spin ${sizes[size]} ${colors} ${className}`}
      {...props}
    />
  );
}
