import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { profile } from "@/content/profile";
import { GlassCard } from "@/components/ui/GlassCard";
import { TechTag } from "@/components/ui/TechTag";
import { GraduationCap } from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
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

const skillCategories = Object.entries(profile.skills);

export function Skills() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="skills" className="relative py-24 px-4 sm:px-6 lg:px-12 section-ambient">
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
          Skills & Stack
        </motion.h2>
        <motion.p variants={itemVariants} className="text-muted-foreground mb-12 max-w-2xl">
          Technologies and tools I work with
        </motion.p>

        <div className="grid sm:grid-cols-2 gap-6 mb-8">
          {skillCategories.map(([category, skills]) => (
            <motion.div key={category} variants={itemVariants}>
              <GlassCard className="h-full">
                <h3 className="text-lg font-semibold text-primary mb-4">{category}</h3>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <TechTag key={skill} variant="secondary">{skill}</TechTag>
                  ))}
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* Currently Learning */}
        <motion.div variants={itemVariants}>
          <GlassCard variant="subtle" className="inline-flex items-center gap-4 px-6 py-4">
            <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Currently Learning</span>
              <div className="flex gap-2 mt-1">
                {profile.currentlyLearning.map((item) => (
                  <TechTag key={item}>{item}</TechTag>
                ))}
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>
    </section>
  );
}
