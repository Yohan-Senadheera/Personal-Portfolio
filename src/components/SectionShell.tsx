import React from "react";

type Props = {
  id?: string;
  children: React.ReactNode;
  variant?: "plain" | "alt" | "deep";
  stagger?: boolean;
};

export function SectionShell({
  id,
  children,
  variant = "plain",
  stagger,
}: Props) {
  // Slightly tighter rhythm (fixes big gaps between sections)
  const base = "relative w-full py-16 sm:py-20 lg:py-24";

  const variants: Record<string, string> = {
    plain: "",
    alt: "bg-white/5 backdrop-blur-[2px]",
    deep: "bg-black/30 backdrop-blur-[2px]",
  };

  return (
    <section
      id={id}
      className={`${base} ${variants[variant]} overflow-hidden`}
      data-reveal
    >
      {/* Smooth blend from the previous section */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/40 to-transparent" />

      {/* Optional subtle tech line (matches your old sections vibe) */}
      <div className="pointer-events-none absolute inset-x-0 top-10 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="relative mx-auto w-full max-w-6xl px-5 sm:px-6 lg:px-8">
        <div className="section-divider bg-white/20 mb-10" />
        <div {...(stagger ? { "data-reveal": "stagger" } : {})}>{children}</div>
      </div>
    </section>
  );
}
