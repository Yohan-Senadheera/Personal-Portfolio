import { useMemo, useRef, useState } from "react";
import { motion, useInView, useReducedMotion, easeInOut } from "framer-motion";
import { profile } from "@/content/profile";
import { GlassCard } from "@/components/ui/GlassCard";
import { TechTag } from "@/components/ui/TechTag";
import {
  ExternalLink,
  Github,
  Award,
  Calendar,
  Users,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";


const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 22, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.55, ease: easeInOut },
  },
};

type ProjectLinkShape = { demo?: string; repo?: string };

function ProjectCard({
  project,
  index,
}: {
  project: (typeof profile.projects)[number];
  index: number;
}) {
  const prefersReduced = useReducedMotion();
  const cardRef = useRef<HTMLDivElement | null>(null);      

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const r = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;

    cardRef.current.style.setProperty("--x", `${x}%`);
    cardRef.current.style.setProperty("--y", `${y}%`);

    if (prefersReduced) return;

    // subtle tilt
    const px = e.clientX - r.left - r.width / 2;
    const py = e.clientY - r.top - r.height / 2;
    const rx = (-py / r.height) * 5; // rotateX
    const ry = (px / r.width) * 6; // rotateY
    cardRef.current.style.setProperty("--rx", `${rx}deg`);
    cardRef.current.style.setProperty("--ry", `${ry}deg`);
  };

  const onLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.setProperty("--rx", `0deg`);
    cardRef.current.style.setProperty("--ry", `0deg`);
  };

  const links = project.links as ProjectLinkShape;

  return (
    <motion.div variants={itemVariants}>
      <div
        ref={cardRef}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        className="relative"
        style={{
          transformStyle: "preserve-3d",
        }}
      >
        <GlassCard
          variant={project.featured ? "glow" : "default"}
          className={[
            "group relative overflow-hidden",
            "transition-transform duration-300",
            project.featured ? "border-primary/30" : "",
          ].join(" ")}
        >
          {/* cursor glow overlay */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100"
            style={{
              background:
                "radial-gradient(700px circle at var(--x, 50%) var(--y, 50%), rgba(255,255,255,0.14), transparent 40%)",
            }}
          />

          {/* subtle tilt wrapper */}
          <div
            className="relative"
            style={
              prefersReduced
                ? undefined
                : {
                    transform:
                      "perspective(900px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg))",
                    transition: "transform 120ms ease",
                  }
            }
          >
            {/* Featured badge */}
            {project.featured && (
              <div className="absolute top-4 right-4 z-10">
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
                    <h3 className="text-xl font-semibold font-display transition-colors group-hover:text-primary">
                      {project.title}
                    </h3>
                    {project.subtitle && (
                      <p className="text-sm text-muted-foreground">
                        {project.subtitle}
                      </p>
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

                {/* Contribution + Result (compact but strong) */}
                <div className="grid gap-3 mb-4 ml-5">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="text-[11px] uppercase tracking-wider text-primary/80 font-medium">
                      My Contribution
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {project.whatIDid}
                    </p>
                  </div>

                  {project.result && (
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <div className="text-[11px] uppercase tracking-wider text-secondary/80 font-medium">
                        Result
                      </div>
                      <p className="text-sm text-secondary mt-1">
                        {project.result}
                      </p>
                    </div>
                  )}
                </div>

                {/* Tech tags */}
                <div className="flex flex-wrap gap-2 ml-5">
                  {project.tech.map((tech) => (
                    <TechTag key={tech}>{tech}</TechTag>
                  ))}
                </div>
              </div>

              {/* Actions */}
              {(links?.demo || links?.repo) && (
                <div className="flex lg:flex-col gap-2 ml-5 lg:ml-0">
                  {links.demo && (
                    <Button size="sm" variant="outline" asChild>
                      <a
                        href={links.demo}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Demo
                      </a>
                    </Button>
                  )}
                  {links.repo && (
                    <Button size="sm" variant="outline" asChild>
                      <a
                        href={links.repo}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Github className="w-4 h-4 mr-1" />
                        Code
                      </a>
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </GlassCard>

        {/* tiny “depth” shadow line */}
        <div className="mt-3 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition" />
      </div>
    </motion.div>
  );
}

export function Projects() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  const [filter, setFilter] = useState<"all" | "featured">("all");

  const sortedProjects = useMemo(() => {
    const base = [...profile.projects].sort(
      (a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0),
    );
    if (filter === "featured") return base.filter((p) => p.featured);
    return base;
  }, [filter]);

  const featuredCount = useMemo(
    () => profile.projects.filter((p) => p.featured).length,
    [],
  );

  return (
    // IMPORTANT: no outer <section id="projects"> because SectionShell already wraps this
    <motion.div
      ref={ref}
      className="max-w-6xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
    >
      <motion.div
        variants={itemVariants}
        className="flex items-end justify-between gap-4 flex-wrap"
      >
        <div>
          <h2 className="text-3xl sm:text-4xl font-bold font-display mb-3">
            Projects
          </h2>
          <p className="text-muted-foreground max-w-2xl">
            Network modules and systems I’ve built and contributed to.
          </p>
        </div>

        {/* simple interactive filter */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
          >
            All
          </Button>
          <Button
            size="sm"
            variant={filter === "featured" ? "default" : "outline"}
            onClick={() => setFilter("featured")}
          >
            Featured ({featuredCount})
          </Button>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="mt-10 grid gap-6">
        {sortedProjects.map((project, index) => (
          <ProjectCard key={project.title} project={project} index={index} />
        ))}
      </motion.div>
    </motion.div>
  );
}
