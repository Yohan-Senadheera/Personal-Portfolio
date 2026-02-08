import { motion, useInView, easeInOut } from "framer-motion";
import { useRef } from "react";
import { profile } from "@/content/profile";
import { GlassCard } from "@/components/ui/GlassCard";
import { Compass, Camera, Wrench, Target } from "lucide-react";

const iconMap = {
  compass: Compass,
  camera: Camera,
  tool: Wrench,
  target: Target,
};

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 28, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.5, ease: easeInOut },
  },
};

export function InterestingFacts() {
  const ref = useRef<HTMLDivElement | null>(null);
  const isInView = useInView(ref, { once: true, margin: "-120px" });

  return (
    <motion.div
      ref={ref}
      className="max-w-6xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
    >
      {/* Heading */}
      <motion.h2
        variants={itemVariants}
        className="text-3xl sm:text-4xl font-bold font-display mb-4"
      >
        Beyond Engineering
      </motion.h2>
      <motion.p
        variants={itemVariants}
        className="text-muted-foreground mb-14 max-w-2xl"
      >
        When I'm not building systems, you'll find me exploring the outdoors,
        capturing moments, or working on creative projects.
      </motion.p>

      {/* Facts grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {profile.interestingFacts.map((fact) => {
          const Icon = iconMap[fact.icon as keyof typeof iconMap];
          return (
            <motion.div key={fact.title} variants={itemVariants}>
              <GlassCard
                variant="subtle"
                className="h-full transition hover:border-primary/30"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2 text-base">{fact.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {fact.description}
                </p>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
