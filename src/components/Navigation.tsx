import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { profile } from "@/content/profile";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Navigation() {
  const [activeSection, setActiveSection] = useState("hero");
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  const navRef = useRef<HTMLElement | null>(null);
  const desktopWrapRef = useRef<HTMLDivElement | null>(null);

  // Active pill position (desktop)
  const [pill, setPill] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);

      const totalScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      const progress =
        totalScroll > 0 ? (window.scrollY / totalScroll) * 100 : 0;
      setScrollProgress(progress);

      const sections = profile.navigation.map((nav) => nav.id);
      for (let i = sections.length - 1; i >= 0; i--) {
        const section = document.getElementById(sections[i]);
        if (section) {
          const rect = section.getBoundingClientRect();
          if (rect.top <= 160) {
            setActiveSection(sections[i]);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMobileMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Close mobile menu on outside click
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const onDown = (e: MouseEvent) => {
      const nav = navRef.current;
      if (!nav) return;
      // If click is outside nav + menu panel area, close
      const target = e.target as Node;
      if (!nav.contains(target)) setIsMobileMenuOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [isMobileMenuOpen]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setIsMobileMenuOpen(false);
    }
  };

  // Update the sliding pill position (desktop)
  useLayoutEffect(() => {
    const wrap = desktopWrapRef.current;
    if (!wrap) return;

    const activeBtn = wrap.querySelector<HTMLButtonElement>(
      `button[data-nav-id="${activeSection}"]`,
    );
    if (!activeBtn) return;

    const wrapRect = wrap.getBoundingClientRect();
    const btnRect = activeBtn.getBoundingClientRect();
    setPill({
      left: btnRect.left - wrapRect.left,
      width: btnRect.width,
    });
  }, [activeSection, isScrolled]);

  // Also update pill on resize
  useEffect(() => {
    const onResize = () => {
      const wrap = desktopWrapRef.current;
      if (!wrap) return;

      const activeBtn = wrap.querySelector<HTMLButtonElement>(
        `button[data-nav-id="${activeSection}"]`,
      );
      if (!activeBtn) return;

      const wrapRect = wrap.getBoundingClientRect();
      const btnRect = activeBtn.getBoundingClientRect();
      setPill({
        left: btnRect.left - wrapRect.left,
        width: btnRect.width,
      });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [activeSection]);

  return (
    <>
      <motion.nav
        ref={navRef}
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          isScrolled ? "glass-panel backdrop-blur-xl" : "bg-transparent",
        )}
      >
        {/* Progress bar */}
        <div
          className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-primary via-secondary to-accent"
          style={{ width: `${scrollProgress}%` }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Name */}
            <button
              onClick={() => scrollToSection("hero")}
              className="font-display font-bold text-lg hover:text-primary transition-colors"
            >
              Yohan Senadheera
            </button>

            {/* Desktop Navigation */}
            <div
              ref={desktopWrapRef}
              className="relative hidden md:flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-1"
            >
              {/* Sliding pill */}
              <motion.div
                className="absolute top-1 bottom-1 rounded-lg bg-primary/15 border border-primary/25"
                animate={{ x: pill.left, width: pill.width }}
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
              />

              {profile.navigation.map((nav) => (
                <button
                  key={nav.id}
                  data-nav-id={nav.id}
                  onClick={() => scrollToSection(nav.id)}
                  className={cn(
                    "relative z-10 px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                    activeSection === nav.id
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {nav.label}
                </button>
              ))}
            </div>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile menu (animated properly) */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="md:hidden border-t border-white/10 glass-panel"
            >
              <div className="p-4 space-y-1">
                {profile.navigation.map((nav) => (
                  <button
                    key={nav.id}
                    onClick={() => scrollToSection(nav.id)}
                    className={cn(
                      "w-full text-left px-4 py-3 rounded-lg transition-colors",
                      activeSection === nav.id
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                    )}
                  >
                    {nav.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Spacer so content doesn’t hide behind navbar (optional) */}
      <div className="h-16" />
    </>
  );
}
