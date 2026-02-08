import { lazy, Suspense } from "react";
import { useSmoothScroll } from "@/hooks/useSmoothScroll";
import { useReveal } from "@/hooks/useReveal";
import { Navigation } from "@/components/Navigation";
import { AmbientBackground } from "@/components/AmbientBackground";
import { Hero } from "@/components/sections/Hero";
import { About } from "@/components/sections/About";
import { InterestingFacts } from "@/components/sections/InterestingFacts";
import { Projects } from "@/components/sections/Projects";
import { Skills } from "@/components/sections/Skills";
import { Experience } from "@/components/sections/Experience";
import { Awards } from "@/components/sections/Awards";
import { Certifications } from "@/components/sections/Certifications";
import { Contact } from "@/components/sections/Contact";
import { SectionShell } from "@/components/SectionShell";
import { CursorGlow } from "@/components/CursorGlow";

// Lazy load 3D components
const NetworkMeshCanvas = lazy(() => import("@/components/three/NetworkMesh"));

function NetworkMeshFallback() {
  return (
    <div className="fixed inset-0 -z-10 bg-gradient-to-b from-background via-background to-background" />
  );
}

export default function Index() {
  const { scrollY } = useSmoothScroll();

  // 🔥 This adds life to every section that has data-reveal
  useReveal();

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* 3D Background */}
      <Suspense fallback={<NetworkMeshFallback />}>
        <NetworkMeshCanvas scrollY={scrollY} />
      </Suspense>
      <CursorGlow />
      {/* Ambient effects */}
      <AmbientBackground />

      {/* Navigation */}
      <Navigation />

      {/* Main content */}
      <main className="relative z-10">
        {/* Keep Hero special (no shell) */}
        <div data-reveal>
          <Hero />
        </div>

        <SectionShell id="about" variant="plain" stagger>
          <About />
        </SectionShell>

        <SectionShell id="facts" variant="alt" stagger>
          <InterestingFacts />
        </SectionShell>

        <SectionShell id="projects" variant="deep">
          <Projects />
        </SectionShell>

        <SectionShell id="skills" variant="deep" stagger>
          <Skills />
        </SectionShell>

        <SectionShell id="experience" variant="plain">
          <Experience />
        </SectionShell>

        <SectionShell id="awards" variant="alt" stagger>
          <Awards />
        </SectionShell>

        <SectionShell id="certifications" variant="plain" stagger>
          <Certifications />
        </SectionShell>

        <SectionShell id="contact" variant="deep">
          <Contact />
        </SectionShell>
      </main>
    </div>
  );
}
