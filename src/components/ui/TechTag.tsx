import { cn } from "@/lib/utils";

interface TechTagProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
}

export function TechTag({ children, variant = "primary", className }: TechTagProps) {
  return (
    <span
      className={cn(
        variant === "primary" ? "tech-tag" : "tech-tag-secondary",
        className
      )}
    >
      {children}
    </span>
  );
}
