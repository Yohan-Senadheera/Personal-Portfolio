import { motion } from "framer-motion";
import { profile } from "@/content/profile";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Mail, Linkedin, Github, Download, MapPin, Globe, ChevronDown, Sparkles } from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 },
  },
};

export function Hero() {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-start px-4 sm:px-6 lg:px-12 py-20"
    >
      {/* Ambient gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
      
      {/* Grid overlay */}
      <div className="absolute inset-0 grid-overlay opacity-30 pointer-events-none" />
      
      <motion.div
        className="w-full max-w-2xl z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <GlassCard variant="glow" className="p-8 lg:p-10">
          {/* Available badge */}
          <motion.div variants={itemVariants} className="mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/20 border border-secondary/40 text-secondary text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              {profile.contact.availability}
            </span>
          </motion.div>

          {/* Name */}
          <motion.h1
            variants={itemVariants}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display mb-3 glow-text"
          >
            {profile.name}
          </motion.h1>

          {/* Headline */}
          <motion.p
            variants={itemVariants}
            className="text-xl sm:text-2xl text-muted-foreground mb-2"
          >
            {profile.headline}
          </motion.p>

          {/* Tagline */}
          <motion.p
            variants={itemVariants}
            className="text-lg text-primary font-medium mb-6"
          >
            {profile.tagline}
          </motion.p>

          {/* Summary */}
          <motion.p
            variants={itemVariants}
            className="text-muted-foreground leading-relaxed mb-8 max-w-xl"
          >
            Hands-on experience in 5G network deployment, containerization, and cloud infrastructure. 
            Built edge UPF on Raspberry Pi, CI/CD pipelines on Kubernetes/AWS, and mobile apps with 
            Firebase backends. Seeking DevOps, SE, or Networking internships.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div variants={itemVariants} className="flex flex-wrap gap-3 mb-8">
            <Button
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 glow-border"
              onClick={() => document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' })}
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
              <a href={profile.linkedin} target="_blank" rel="noopener noreferrer">
                <Linkedin className="w-4 h-4" />
              </a>
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="border-border hover:bg-muted/50 hover:border-primary/50"
              asChild
            >
              <a href={profile.github} target="_blank" rel="noopener noreferrer">
                <Github className="w-4 h-4" />
              </a>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-border hover:bg-muted/50 hover:border-secondary/50"
              asChild
            >
              <a href={profile.cvUrl} download>
                <Download className="w-4 h-4 mr-2" />
                Download CV
              </a>
            </Button>
          </motion.div>

          {/* Meta info */}
          <motion.div
            variants={itemVariants}
            className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground"
          >
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-primary" />
              {profile.location}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-secondary" />
              <a
                href={`https://${profile.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                {profile.website}
              </a>
            </span>
          </motion.div>
        </GlassCard>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 scroll-indicator"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.5 }}
      >
        <span className="text-xs text-muted-foreground uppercase tracking-wider">Scroll</span>
        <ChevronDown className="w-5 h-5 text-primary animate-bounce" />
      </motion.div>
    </section>
  );
}
