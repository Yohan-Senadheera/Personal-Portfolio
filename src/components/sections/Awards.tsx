import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { profile } from "@/content/profile";
import { GlassCard } from "@/components/ui/GlassCard";
import { Trophy, Medal, Award } from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5 },
  },
};

export function Awards() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="awards" className="relative py-24 px-4 sm:px-6 lg:px-12 section-ambient">
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
          Awards & Recognition
        </motion.h2>
        <motion.p variants={itemVariants} className="text-muted-foreground mb-12 max-w-2xl">
          Achievements and milestones
        </motion.p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {profile.awards.map((award, index) => {
            const subtitle = 'subtitle' in award ? award.subtitle : undefined;
            const project = 'project' in award ? award.project : undefined;
            const organization = 'organization' in award ? award.organization : undefined;
            
            return (
              <motion.div key={award.title} variants={itemVariants}>
                <GlassCard
                  variant={award.highlight ? "glow" : "default"}
                  className={`h-full ${award.highlight ? 'border-primary/40' : ''}`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      award.highlight ? 'bg-primary/20' : 'bg-muted/50'
                    }`}>
                      {award.highlight ? (
                        <Trophy className="w-6 h-6 text-primary" />
                      ) : index % 2 === 0 ? (
                        <Medal className="w-6 h-6 text-muted-foreground" />
                      ) : (
                        <Award className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold">{award.title}</h3>
                      {subtitle && (
                        <p className="text-sm text-primary">{subtitle}</p>
                      )}
                      {project && (
                        <p className="text-sm text-muted-foreground">{project}</p>
                      )}
                      {organization && (
                        <p className="text-sm text-muted-foreground">{organization}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">{award.date}</p>
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
