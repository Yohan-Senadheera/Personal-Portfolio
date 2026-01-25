import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { profile } from "@/content/profile";
import { GlassCard } from "@/components/ui/GlassCard";
import { TechTag } from "@/components/ui/TechTag";
import { CheckCircle2, Clock, Award } from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4 },
  },
};

export function Certifications() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const completed = profile.certifications.filter((c) => c.status === "completed");
  const inProgress = profile.certifications.filter((c) => c.status === "in-progress");

  return (
    <section id="certifications" className="relative py-24 px-4 sm:px-6 lg:px-12 section-ambient">
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
          Courses & Certifications
        </motion.h2>
        <motion.p variants={itemVariants} className="text-muted-foreground mb-12 max-w-2xl">
          Continuous learning and professional development
        </motion.p>

        {/* In Progress */}
        {inProgress.length > 0 && (
          <>
            <motion.h3 variants={itemVariants} className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-secondary" />
              In Progress
            </motion.h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
              {inProgress.map((cert) => (
                <motion.div key={cert.title} variants={itemVariants}>
                  <GlassCard variant="subtle" className="border-secondary/30">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-secondary mt-2 animate-pulse" />
                      <div>
                        <h4 className="font-medium">{cert.title}</h4>
                        <p className="text-sm text-muted-foreground">{cert.issuer}</p>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </>
        )}

        {/* Completed */}
        <motion.h3 variants={itemVariants} className="text-lg font-semibold mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-primary" />
          Completed
        </motion.h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {completed.map((cert) => {
            const subtitle = 'subtitle' in cert ? cert.subtitle : undefined;
            const date = 'date' in cert ? cert.date : undefined;
            
            return (
              <motion.div key={cert.title} variants={itemVariants}>
                <GlassCard variant="subtle">
                  <div className="flex items-start gap-3">
                    {subtitle ? (
                      <Award className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-primary/60 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <h4 className="font-medium">{cert.title}</h4>
                      {subtitle && (
                        <p className="text-sm text-secondary">{subtitle}</p>
                      )}
                      <p className="text-sm text-muted-foreground">{cert.issuer}</p>
                      {date && (
                        <p className="text-xs text-muted-foreground mt-1">{date}</p>
                      )}
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </section>
  );
}
