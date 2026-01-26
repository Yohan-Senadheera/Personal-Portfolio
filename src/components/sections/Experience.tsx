import { motion, useInView, cubicBezier } from "framer-motion";
import { useRef, useState } from "react";
import { profile } from "@/content/profile";
import { GlassCard } from "@/components/ui/GlassCard";
import {
  Briefcase,
  GraduationCap,
  Users,
  Code,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.55, ease: cubicBezier(0.22, 1, 0.36, 1) },
  },
};

const typeIcons = {
  teaching: GraduationCap,
  leadership: Users,
  technical: Code,
  work: Briefcase,
};

export function Experience() {
  const ref = useRef<HTMLDivElement | null>(null);
  const isInView = useInView(ref, { once: true, margin: "-120px" });
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpand = (title: string) => {
    setExpandedItems((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title],
    );
  };

  return (
    <motion.div
      ref={ref}
      className="max-w-4xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
    >
      {/* Heading */}
      <motion.h2
        variants={itemVariants}
        className="text-3xl sm:text-4xl font-bold font-display mb-4"
      >
        Experience
      </motion.h2>
      <motion.p
        variants={itemVariants}
        className="text-muted-foreground mb-14 max-w-2xl"
      >
        Leadership, teaching, and professional journey
      </motion.p>

      {/* Timeline */}
      <div className="relative">
        {/* Animated timeline line */}
        <motion.div
          className="absolute left-[18px] top-0 w-px bg-gradient-to-b from-primary/0 via-primary/40 to-primary/0"
          initial={{ height: 0 }}
          animate={isInView ? { height: "100%" } : {}}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />

        <div className="space-y-8">
          {profile.experience.map((exp, index) => {
            const Icon =
              typeIcons[exp.type as keyof typeof typeIcons] || Briefcase;
            const expandable = "expandable" in exp ? exp.expandable : false;
            const isExpanded = expandedItems.includes(exp.title);
            const subtitle = "subtitle" in exp ? exp.subtitle : undefined;

            return (
              <motion.div
                key={`${exp.title}-${index}`}
                variants={itemVariants}
                className="relative"
              >
                <div className="flex gap-6">
                  {/* Timeline dot */}
                  <div className="relative z-10 mt-7">
                    <div className="w-3 h-3 rounded-full bg-primary shadow-[0_0_0_6px_rgba(99,102,241,0.15)]" />
                  </div>

                  {/* Card */}
                  <GlassCard
                    variant="subtle"
                    className="flex-1 transition hover:border-primary/30"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{exp.title}</h3>
                          {subtitle && (
                            <p className="text-sm text-muted-foreground">
                              {subtitle}
                            </p>
                          )}
                          <p className="text-sm text-primary">
                            {exp.organization}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {exp.timeframe}
                          </p>
                        </div>
                      </div>

                      {expandable && (
                        <button
                          onClick={() => toggleExpand(exp.title)}
                          className="text-muted-foreground hover:text-foreground transition"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5" />
                          ) : (
                            <ChevronDown className="w-5 h-5" />
                          )}
                        </button>
                      )}
                    </div>

                    {/* Always-visible summary */}
                    <p className="text-sm text-muted-foreground mt-4 ml-13">
                      {exp.description}
                    </p>

                    {/* Optional expanded details */}
                    {expandable && (
                      <motion.div
                        initial={false}
                        animate={{
                          height: isExpanded ? "auto" : 0,
                          opacity: isExpanded ? 1 : 0,
                        }}
                        transition={{ duration: 0.35 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 ml-13 text-sm text-muted-foreground border-l border-primary/20 pl-4">
                          {"details" in exp && exp.details}
                        </div>
                      </motion.div>
                    )}
                  </GlassCard>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
