import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { profile } from "@/content/profile";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Mail, Linkedin, Github, Download, Send } from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 },
  },
};

export function Contact() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="contact" className="relative py-24 px-4 sm:px-6 lg:px-12 section-ambient">
      <div className="tech-line mb-16" />
      
      <motion.div
        ref={ref}
        className="max-w-2xl mx-auto text-center"
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
      >
        <motion.h2
          variants={itemVariants}
          className="text-3xl sm:text-4xl font-bold font-display mb-4"
        >
          Let's Connect
        </motion.h2>
        
        <motion.div variants={itemVariants}>
          <GlassCard variant="glow" className="mb-8">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Send className="w-6 h-6 text-primary" />
              <p className="text-lg font-medium">{profile.contact.cta}</p>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              <Button
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                asChild
              >
                <a href={`mailto:${profile.email}`}>
                  <Mail className="w-4 h-4 mr-2" />
                  Email Me
                </a>
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                className="border-border hover:bg-muted/50"
                asChild
              >
                <a href={profile.linkedin} target="_blank" rel="noopener noreferrer">
                  <Linkedin className="w-4 h-4 mr-2" />
                  LinkedIn
                </a>
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                className="border-border hover:bg-muted/50"
                asChild
              >
                <a href={profile.github} target="_blank" rel="noopener noreferrer">
                  <Github className="w-4 h-4 mr-2" />
                  GitHub
                </a>
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                className="border-secondary/50 hover:bg-secondary/10 text-secondary hover:text-secondary"
                asChild
              >
                <a href={profile.cvUrl} download>
                  <Download className="w-4 h-4 mr-2" />
                  Download CV
                </a>
              </Button>
            </div>
          </GlassCard>
        </motion.div>

        {/* Email display */}
        <motion.p variants={itemVariants} className="text-muted-foreground">
          {profile.email}
        </motion.p>
      </motion.div>

      {/* Footer */}
      <motion.footer
        variants={itemVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        className="mt-24 pt-8 border-t border-border/50 text-center text-sm text-muted-foreground"
      >
        <p>© {new Date().getFullYear()} {profile.name}. Built with passion.</p>
      </motion.footer>
    </section>
  );
}
