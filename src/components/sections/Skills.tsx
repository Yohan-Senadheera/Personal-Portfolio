import { motion, useInView, cubicBezier } from "framer-motion";
import { useRef } from "react";
import { profile } from "@/content/profile";
import { GlassCard } from "@/components/ui/GlassCard";
import { TechTag } from "@/components/ui/TechTag";
import { GraduationCap } from "lucide-react";

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
    transition: { duration: 0.5, ease: cubicBezier(0.22, 1, 0.36, 1) },
  },
};

const skillCategories = Object.entries(profile.skills);

export function Skills() {
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
        Skills & Stack
      </motion.h2>
      <motion.p
        variants={itemVariants}
        className="text-muted-foreground mb-14 max-w-2xl"
      >
        Technologies and tools I actively work with across networking, systems,
        and development.
      </motion.p>

      {/* Skill domains */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-14">
        {skillCategories.map(([category, skills]) => (
          <motion.div key={category} variants={itemVariants}>
            <GlassCard
              className="h-full group transition hover:border-primary/30"
              variant="default"
            >
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-primary mb-1">
                  {category}
                </h3>
                <div className="h-px w-10 bg-primary/40 group-hover:w-16 transition-all duration-300" />
              </div>

              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <TechTag key={skill} variant="secondary">
                    {skill}
                  </TechTag>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Currently learning — highlighted strip */}
      <motion.div variants={itemVariants}>
        <GlassCard
          variant="subtle"
          className="flex flex-col sm:flex-row sm:items-center gap-4 px-6 py-5 border border-secondary/30 bg-secondary/10"
        >
          <div className="w-11 h-11 rounded-lg bg-secondary/20 flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-5 h-5 text-secondary" />
          </div>

          <div>
            <span className="text-sm uppercase tracking-wider text-secondary/80 font-medium">
              Currently Learning
            </span>
            <div className="flex flex-wrap gap-2 mt-2">
              {profile.currentlyLearning.map((item) => (
                <TechTag key={item}>{item}</TechTag>
              ))}
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}
