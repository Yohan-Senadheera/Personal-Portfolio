import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export function AmbientBackground() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="fixed inset-0 -z-20 pointer-events-none overflow-hidden">
      {/* Grid overlay with parallax */}
      <div
        className="absolute inset-0 grid-overlay opacity-20"
        style={{
          transform: `translateY(${scrollY * 0.05}px)`,
        }}
      />

      {/* Gradient orbs */}
      <motion.div
        className="absolute -top-40 -right-40 w-96 h-96 rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(252 87% 67% / 0.15) 0%, transparent 70%)",
          transform: `translateY(${scrollY * 0.1}px)`,
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.5, 0.7, 0.5],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute top-1/3 -left-40 w-80 h-80 rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(190 95% 55% / 0.1) 0%, transparent 70%)",
          transform: `translateY(${scrollY * 0.08}px)`,
        }}
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.4, 0.6, 0.4],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
      />

      <motion.div
        className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(270 80% 65% / 0.1) 0%, transparent 70%)",
          transform: `translateY(${scrollY * 0.06}px)`,
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 4,
        }}
      />

      {/* Traveling packet lines */}
      <div className="absolute inset-0">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="absolute h-px w-32 animate-packet-move"
            style={{
              top: `${25 + i * 25}%`,
              left: 0,
              background: `linear-gradient(90deg, transparent, hsl(190 95% 70% / 0.6), transparent)`,
              animationDelay: `${i * 5}s`,
            }}
          />
        ))}
      </div>

      {/* HUD lines */}
      <div
        className="absolute top-20 left-0 w-40 h-px"
        style={{
          background: "linear-gradient(90deg, hsl(252 87% 67% / 0.3), transparent)",
          opacity: 0.5 + (scrollY * 0.0005),
        }}
      />
      <div
        className="absolute top-40 right-0 w-60 h-px"
        style={{
          background: "linear-gradient(270deg, hsl(190 95% 55% / 0.3), transparent)",
          opacity: 0.5 + (scrollY * 0.0005),
        }}
      />
    </div>
  );
}
