import { lazy, Suspense } from "react";
import { useSmoothScroll } from "@/hooks/useSmoothScroll";
import { Navigation } from "@/components/Navigation";
import { AmbientBackground } from "@/components/AmbientBackground";
import { Hero } from "@/components/sections/Hero";
import { About } from "@/components/sections/About";
import { Projects } from "@/components/sections/Projects";
import { Skills } from "@/components/sections/Skills";
import { Experience } from "@/components/sections/Experience";
import { Awards } from "@/components/sections/Awards";
import { Certifications } from "@/components/sections/Certifications";
import { Contact } from "@/components/sections/Contact";

// Lazy load 3D components to avoid SSR issues
const NetworkMeshCanvas = lazy(() => import("@/components/three/NetworkMesh"));

function NetworkMeshFallback() {
  return (
    <div className="fixed inset-0 -z-10 bg-gradient-to-b from-background via-background to-background" />
  );
}

export default function Index() {
  const { scrollY } = useSmoothScroll();

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* 3D Background */}
      <Suspense fallback={<NetworkMeshFallback />}>
        <NetworkMeshCanvas scrollY={scrollY} />
      </Suspense>

      {/* Ambient effects */}
      <AmbientBackground />

      {/* Navigation */}
      <Navigation />

      {/* Main content */}
      <main className="relative z-10">
        <Hero />
        <About />
        <Projects />
        <Skills />
        <Experience />
        <Awards />
        <Certifications />
        <Contact />
      </main>
    </div>
  );
}
