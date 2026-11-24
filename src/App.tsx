import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Journey from "./pages/Journey";
import NotFound from "./pages/NotFound";
import ILoveYou from "./pages/ILoveYou";

const ToolsIndex = lazy(() => import("./pages/tools/ToolsIndex"));
const PodDoctor = lazy(() => import("./pages/tools/PodDoctor"));
const SloAlerts = lazy(() => import("./pages/tools/SloAlerts"));
const CertInspector = lazy(() => import("./pages/tools/CertInspector"));
const toolPage = (el: JSX.Element) => <Suspense fallback={<div style={{ minHeight: "100vh", background: "#05070c" }} />}>{el}</Suspense>;

const queryClient = new QueryClient();

// Force dark mode
if (typeof document !== 'undefined') {
  document.documentElement.classList.add('dark');
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Journey />} />
          <Route path="/classic" element={<Index />} />
          <Route path="/tools" element={toolPage(<ToolsIndex />)} />
          <Route path="/tools/pod-doctor" element={toolPage(<PodDoctor />)} />
          <Route path="/tools/slo-alerts" element={toolPage(<SloAlerts />)} />
          <Route path="/tools/cert-inspector" element={toolPage(<CertInspector />)} />
          <Route path="/i-love-you" element={<ILoveYou />} />
          <Route path="/iloveyou" element={<ILoveYou />} />
          <Route path="/love" element={<ILoveYou />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
