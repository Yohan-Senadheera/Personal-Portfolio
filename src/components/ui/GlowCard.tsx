import React, { useRef } from "react";

export function GlowCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    el.style.setProperty("--x", `${x}%`);
    el.style.setProperty("--y", `${y}%`);
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      className={
        "relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 " +
        "transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/10 " +
        className
      }
      data-reveal
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 hover:opacity-100"
        style={{
          background:
            "radial-gradient(600px circle at var(--x, 50%) var(--y, 50%), rgba(255,255,255,0.14), transparent 40%)",
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}
