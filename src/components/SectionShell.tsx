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
  const base = "relative w-full py-20 sm:py-24 lg:py-28";
  const variants: Record<string, string> = {
    plain: "",
    alt: "bg-white/5",
    deep: "bg-black/20",
  };

  return (
    <section id={id} className={`${base} ${variants[variant]}`} data-reveal>
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-6 lg:px-8">
        <div className="section-divider bg-white/20 mb-10" />
        <div {...(stagger ? { "data-reveal": "stagger" } : {})}>{children}</div>
      </div>
    </section>
  );
}
