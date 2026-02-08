import { useEffect, useState } from "react";
import { motion, useTransform, useScroll } from "framer-motion";
import { profile } from "@/content/profile";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import {
  Mail,
  Linkedin,
  Github,
  MapPin,
  GraduationCap,
  ChevronDown,
  Sparkles,
} from "lucide-react";

export function Hero() {
  const { scrollY } = useScroll();

  // Subtle cinematic transforms
  const scale = useTransform(scrollY, [0, 300], [1, 0.97]);
  const opacity = useTransform(scrollY, [0, 260], [1, 0.6]);
  const y = useTransform(scrollY, [0, 300], [0, -40]);

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center px-4 sm:px-6 lg:px-12 py-20 overflow-hidden"
    >
      {/* Ambient gradient */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/10 pointer-events-none"
        style={{ opacity }}
      />

      {/* Grid overlay */}
      <motion.div
        className="absolute inset-0 grid-overlay opacity-10 pointer-events-none"
        style={{ opacity }}
      />

      {/* Hero content */}
      <motion.div
        className="w-full max-w-4xl lg:max-w-5xl xl:max-w-6xl z-10"
        style={{ scale, y, opacity }}
      >
        <GlassCard
          variant="glow"
          className="
            p-8 lg:p-12
            [mask-image:linear-gradient(to_right,black_75%,transparent)]
            [-webkit-mask-image:linear-gradient(to_right,black_75%,transparent)]
          "
        >
          {/* Availability */}
          <div className="mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/20 border border-secondary/40 text-secondary text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              {profile.contact.availability}
            </span>
          </div>

          {/* Name */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display mb-3 glow-text">
            {profile.name}
          </h1>

          {/* Headline */}
          <p className="text-xl sm:text-2xl text-muted-foreground mb-2">
            {profile.headline}
          </p>

          {/* Tagline */}
          <p className="text-lg text-primary font-medium mb-6">
            {profile.tagline}
          </p>

          {/* Summary */}
          <p className="text-muted-foreground leading-[1.75] mb-8 max-w-2xl">
            Hands-on experience in 5G network deployment, cloud-native systems,
            and SRE practices. Built edge UPF on Raspberry Pi, observability
            platforms with Prometheus/Grafana, and CI/CD pipelines on
            Kubernetes/AWS. Seeking DevOps, SE, SRE, or Networking internships.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3 mb-8">
            <Button
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 glow-border"
              onClick={() =>
                document
                  .getElementById("projects")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              View Projects
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="border-border hover:bg-muted/50 hover:border-primary/50"
              asChild
            >
              <a href={`mailto:${profile.email}`}>
                <Mail className="w-4 h-4 mr-2" />
                Email
              </a>
            </Button>

            <Button
              size="icon"
              variant="outline"
              className="border-border hover:bg-muted/50 hover:border-primary/50"
              asChild
            >
              <a
                href={profile.linkedin}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Linkedin className="w-4 h-4" />
              </a>
            </Button>

            <Button
              size="icon"
              variant="outline"
              className="border-border hover:bg-muted/50 hover:border-primary/50"
              asChild
            >
              <a
                href={profile.github}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="w-4 h-4" />
              </a>
            </Button>
          </div>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-primary" />
              {profile.location}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-secondary" />
              <a
                href="https://www.pdn.ac.lk"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                University of Peradeniya
              </a>
            </span>
          </div>
        </GlassCard>
      </motion.div>

      {/* Scroll cue */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
      >
        <span className="text-xs text-muted-foreground uppercase tracking-wider">
          Scroll
        </span>
        <ChevronDown className="w-5 h-5 text-primary animate-bounce mx-auto mt-1" />
      </motion.div>
    </section>
  );
}
