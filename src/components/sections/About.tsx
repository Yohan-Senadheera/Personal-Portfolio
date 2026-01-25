import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { profile } from "@/content/profile";
import { GlassCard } from "@/components/ui/GlassCard";
import { Network, Cloud, Zap } from "lucide-react";

const icons = [Network, Cloud, Zap];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export function About() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="about" className="relative py-24 px-4 sm:px-6 lg:px-12 section-ambient">
      <div className="tech-line mb-16" />
      
      <motion.div
        ref={ref}
        className="max-w-6xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
      >
        <motion.h2
          variants={itemVariants}
          className="text-3xl sm:text-4xl font-bold font-display mb-4"
        >
          About Me
        </motion.h2>
        <motion.p variants={itemVariants} className="text-muted-foreground mb-12 max-w-2xl">
          Building the infrastructure that connects the future
        </motion.p>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* What I Build */}
          <motion.div variants={itemVariants}>
            <GlassCard className="h-full">
              <h3 className="text-lg font-semibold text-primary mb-4">What I Build</h3>
              <ul className="space-y-3">
                {profile.about.whatIBuild.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </GlassCard>
          </motion.div>

          {/* What I Care About */}
          <motion.div variants={itemVariants}>
            <GlassCard className="h-full">
              <h3 className="text-lg font-semibold text-secondary mb-4">What I Care About</h3>
              <ul className="space-y-3">
                {profile.about.whatICareAbout.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary mt-2 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </GlassCard>
          </motion.div>
        </div>

        {/* Signature Strengths */}
        <motion.h3
          variants={itemVariants}
          className="text-xl font-semibold mb-6"
        >
          Signature Strengths
        </motion.h3>
        
        <div className="grid sm:grid-cols-3 gap-6">
          {profile.about.strengths.map((strength, i) => {
            const Icon = icons[i];
            return (
              <motion.div key={strength.title} variants={itemVariants}>
                <GlassCard variant="subtle" className="text-center h-full">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h4 className="font-semibold mb-2">{strength.title}</h4>
                  <p className="text-sm text-muted-foreground">{strength.description}</p>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </section>
  );
}
