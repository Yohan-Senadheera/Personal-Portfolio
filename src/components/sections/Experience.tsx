import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { profile } from "@/content/profile";
import { GlassCard } from "@/components/ui/GlassCard";
import { Briefcase, GraduationCap, Users, Code, ChevronDown, ChevronUp } from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5 },
  },
};

const typeIcons = {
  teaching: GraduationCap,
  leadership: Users,
  technical: Code,
  work: Briefcase,
};

export function Experience() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpand = (title: string) => {
    setExpandedItems((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  return (
    <section id="experience" className="relative py-24 px-4 sm:px-6 lg:px-12 section-ambient">
      <div className="tech-line mb-16" />
      
      <motion.div
        ref={ref}
        className="max-w-4xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
      >
        <motion.h2
          variants={itemVariants}
          className="text-3xl sm:text-4xl font-bold font-display mb-4"
        >
          Experience
        </motion.h2>
        <motion.p variants={itemVariants} className="text-muted-foreground mb-12 max-w-2xl">
          Leadership, teaching, and professional journey
        </motion.p>

        {/* Timeline */}
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[19px] top-8 bottom-8 timeline-line" />

          <div className="space-y-4">
            {profile.experience.map((exp, index) => {
              const Icon = typeIcons[exp.type as keyof typeof typeIcons] || Briefcase;
              const isExpanded = expandedItems.includes(exp.title);
              const subtitle = 'subtitle' in exp ? exp.subtitle : undefined;
              const expandable = 'expandable' in exp ? exp.expandable : false;
              
              return (
                <motion.div key={`${exp.title}-${index}`} variants={itemVariants}>
                  <div className="flex gap-4">
                    {/* Timeline dot */}
                    <div className="relative z-10 mt-6">
                      <div className="timeline-dot" />
                    </div>

                    {/* Content */}
                    <GlassCard
                      variant="subtle"
                      className="flex-1 cursor-pointer"
                      onClick={() => expandable && toggleExpand(exp.title)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Icon className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{exp.title}</h3>
                            {subtitle && (
                              <p className="text-sm text-muted-foreground">{subtitle}</p>
                            )}
                            <p className="text-sm text-primary">{exp.organization}</p>
                            <p className="text-xs text-muted-foreground mt-1">{exp.timeframe}</p>
                          </div>
                        </div>
                        
                        {expandable && (
                          <button className="text-muted-foreground hover:text-foreground transition-colors">
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5" />
                            ) : (
                              <ChevronDown className="w-5 h-5" />
                            )}
                          </button>
                        )}
                      </div>

                      {/* Description - show on hover/expand */}
                      <motion.div
                        initial={false}
                        animate={{ 
                          height: isExpanded || !expandable ? "auto" : 0,
                          opacity: isExpanded || !expandable ? 1 : 0
                        }}
                        className="overflow-hidden"
                      >
                        <p className="text-sm text-muted-foreground mt-4 ml-13">
                          {exp.description}
                        </p>
                      </motion.div>
                    </GlassCard>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
