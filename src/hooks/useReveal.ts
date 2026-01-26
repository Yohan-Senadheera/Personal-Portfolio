import { useEffect } from "react";

type RevealOptions = {
  selector?: string;
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
};

export function useReveal({
  selector = "[data-reveal]",
  threshold = 0.12,
  rootMargin = "0px 0px -10% 0px",
  once = true,
}: RevealOptions = {}) {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>(selector));
    if (els.length === 0) return;

    // If IntersectionObserver not supported
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("is-revealed"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const el = e.target as HTMLElement;
          if (e.isIntersecting) {
            el.classList.add("is-revealed");
            if (once) io.unobserve(el);
          } else if (!once) {
            el.classList.remove("is-revealed");
          }
        }
      },
      { threshold, rootMargin },
    );

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [selector, threshold, rootMargin, once]);
}
