import { useEffect, useRef, useState } from "react";

const orbit = ["Kubernetes", "Terraform", "Argo", "AWS", "Azure", "Helm", "Prometheus", "Linux"];

export function ProfilePhoto() {
  const ref = useRef<HTMLDivElement | null>(null);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
    el.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
  };

  return (
    <div className="ops-photo" ref={ref} onPointerMove={onMove}>
      <div className="ops-orbit" aria-hidden="true">
        {orbit.map((t, i) => (
          <span key={t} style={{ "--a": `${(360 / orbit.length) * i}deg` } as React.CSSProperties}>
            <b>{t}</b>
          </span>
        ))}
      </div>
      <div className="ops-photo-ring" aria-hidden="true" />
      <div className="ops-photo-frame">
        <img src="/me.jpg" alt="Yohan Senadheera" width={686} height={744} />
        <span className="ops-photo-glow" aria-hidden="true" />
      </div>
      <div className="ops-photo-tag">
        <span className="ops-dot" aria-hidden="true" />
        <span>
          <b>Yohan</b> · SRE / DevOps
        </span>
      </div>
    </div>
  );
}

const roles = ["Site Reliability Engineering", "DevOps", "Cloud Infrastructure"];

export function OpenToWork() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  return (
    <div
      className="ops-otw"
      ref={ref}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button className="ops-pill" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="true">
        <span className="ops-dot" aria-hidden="true" />
        open to work
      </button>
      {open && (
        <div className="ops-otw-pop" role="dialog" aria-label="Roles I am open to">
          <div className="ops-eyebrow">open to roles in</div>
          <ul>
            {roles.map((r) => (
              <li key={r}>
                <span className="ok">✓</span> {r}
              </li>
            ))}
          </ul>
          <div className="ops-otw-meta">
            <span>available immediately</span>
            <span>Colombo · hybrid · remote</span>
          </div>
          <a className="ops-btn primary" href="#contact" onClick={() => setOpen(false)}>
            get in touch →
          </a>
        </div>
      )}
    </div>
  );
}
