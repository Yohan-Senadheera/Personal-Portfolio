import { motion, useInView, easeInOut } from "framer-motion";
import { useRef } from "react";
import { profile } from "@/content/profile";
import { GlassCard } from "@/components/ui/GlassCard";
import { Network, Cloud, Zap } from "lucide-react";
import { ProfileCard } from "@/components/ui/ProfileCard";


const icons = [Network, Cloud, Zap];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.14 },
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

export function About() {
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
        About Me
      </motion.h2>

      {/* Identity hook */}
      <div className="grid lg:grid-cols-[1.4fr_0.6fr] gap-10 mb-14">
        {/* LEFT — text */}
        <div>
          <motion.p
            variants={itemVariants}
            className="text-muted-foreground mb-10 max-w-3xl leading-relaxed"
          >
            I'm a computer engineering undergraduate focused on building
            reliable, cloud-native systems — from private 5G and edge networks
            to SRE platforms with observability and automation workflows. I care
            deeply about reliability, performance, and making systems work at
            scale.
          </motion.p>

          <div className="grid md:grid-cols-2 gap-8">
            {/* What I Build */}
            <motion.div variants={itemVariants}>
              <GlassCard className="h-full transition hover:border-primary/30">
                <h3 className="text-lg font-semibold text-primary mb-3">
                  What I Build
                </h3>
                <ul className="space-y-3">
                  {profile.about.whatIBuild.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 text-muted-foreground"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </GlassCard>
            </motion.div>

            {/* What I Care About */}
            <motion.div variants={itemVariants}>
              <GlassCard className="h-full transition hover:border-secondary/30">
                <h3 className="text-lg font-semibold text-secondary mb-3">
                  What I Care About
                </h3>
                <ul className="space-y-3">
                  {profile.about.whatICareAbout.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 text-muted-foreground"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary mt-2" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </GlassCard>
            </motion.div>
          </div>
        </div>

        {/* RIGHT — photo */}
        <motion.div variants={itemVariants}>
          <ProfileCard />
        </motion.div>
      </div>

      {/* Signature strengths */}
      <motion.h3 variants={itemVariants} className="text-xl font-semibold mb-6">
        Signature Strengths
      </motion.h3>

      <div className="grid sm:grid-cols-3 gap-6">
        {profile.about.strengths.map((strength, i) => {
          const Icon = icons[i];
          return (
            <motion.div key={strength.title} variants={itemVariants}>
              <GlassCard
                variant="subtle"
                className="text-center h-full transition hover:border-primary/30"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-semibold mb-2">{strength.title}</h4>
                <p className="text-sm text-muted-foreground">
                  {strength.description}
                </p>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
