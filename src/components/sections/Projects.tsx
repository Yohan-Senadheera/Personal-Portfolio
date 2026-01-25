import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { profile } from "@/content/profile";
import { GlassCard } from "@/components/ui/GlassCard";
import { TechTag } from "@/components/ui/TechTag";
import { ExternalLink, Github, Award, Calendar, Users, User } from "lucide-react";
import { Button } from "@/components/ui/button";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 },
  },
};

export function Projects() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  // Sort projects: featured first
  const sortedProjects = [...profile.projects].sort((a, b) => 
    (b.featured ? 1 : 0) - (a.featured ? 1 : 0)
  );

  return (
    <section id="projects" className="relative py-24 px-4 sm:px-6 lg:px-12 section-ambient">
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
          Projects
        </motion.h2>
        <motion.p variants={itemVariants} className="text-muted-foreground mb-12 max-w-2xl">
          Network modules and systems I've built and contributed to
        </motion.p>

        <div className="grid gap-6">
          {sortedProjects.map((project, index) => (
            <motion.div key={project.title} variants={itemVariants}>
              <GlassCard
                variant={project.featured ? "glow" : "default"}
                className={`group relative overflow-hidden ${project.featured ? 'border-primary/30' : ''}`}
              >
                {/* Featured indicator */}
                {project.featured && (
                  <div className="absolute top-4 right-4">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-primary/20 text-primary border border-primary/30">
                      <Award className="w-3 h-3" />
                      Featured
                    </span>
                  </div>
                )}

                <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0 animate-glow-pulse" />
                      <div>
                        <h3 className="text-xl font-semibold font-display group-hover:text-primary transition-colors">
                          {project.title}
                        </h3>
                        {project.subtitle && (
                          <p className="text-sm text-muted-foreground">{project.subtitle}</p>
                        )}
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4 ml-5">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        {project.timeframe}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        {project.type === "Individual Project" ? (
                          <User className="w-4 h-4" />
                        ) : (
                          <Users className="w-4 h-4" />
                        )}
                        {project.type}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-muted-foreground mb-4 ml-5">
                      {project.description}
                    </p>

                    {/* What I Did */}
                    <div className="mb-4 ml-5">
                      <span className="text-xs uppercase tracking-wider text-primary/80 font-medium">My Contribution</span>
                      <p className="text-sm text-muted-foreground mt-1">{project.whatIDid}</p>
                    </div>

                    {/* Result */}
                    {project.result && (
                      <div className="mb-4 ml-5">
                        <span className="text-xs uppercase tracking-wider text-secondary/80 font-medium">Result</span>
                        <p className="text-sm text-secondary mt-1">{project.result}</p>
                      </div>
                    )}

                    {/* Tech tags */}
                    <div className="flex flex-wrap gap-2 ml-5">
                      {project.tech.map((tech) => (
                        <TechTag key={tech}>{tech}</TechTag>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  {(() => {
                    const links = project.links as { demo?: string; repo?: string };
                    return (links.demo || links.repo) ? (
                      <div className="flex lg:flex-col gap-2 ml-5 lg:ml-0">
                        {links.demo && (
                          <Button size="sm" variant="outline" asChild>
                            <a href={links.demo} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4 mr-1" />
                              Demo
                            </a>
                          </Button>
                        )}
                        {links.repo && (
                          <Button size="sm" variant="outline" asChild>
                            <a href={links.repo} target="_blank" rel="noopener noreferrer">
                              <Github className="w-4 h-4 mr-1" />
                              Code
                            </a>
                          </Button>
                        )}
                      </div>
                    ) : null;
                  })()}
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
