import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import React, { Suspense } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import SmoothScrollProvider from "./components/SmoothScrollProvider";
import Preloader from "./components/Preloader"; // Using existing Preloader as fallback
import { HelmetProvider } from "react-helmet-async";
import { Analytics } from "@vercel/analytics/react";
import { AnimatePresence } from "framer-motion";

const Index = React.lazy(() => import("./pages/Index.tsx"));
const V2 = React.lazy(() => import("./pages/V2.tsx"));
const V3 = React.lazy(() => import("./pages/V3.tsx"));
const V4 = React.lazy(() => import("./pages/V4.tsx"));
const V5 = React.lazy(() => import("./pages/V5.tsx"));
const V6 = React.lazy(() => import("./pages/V6.tsx"));
const V7 = React.lazy(() => import("./pages/V7.tsx"));
const NotFound = React.lazy(() => import("./pages/NotFound.tsx"));
const ProyectosV2 = React.lazy(() => import("./pages/ProyectosV2.tsx"));
const ProyectosV3 = React.lazy(() => import("./pages/ProyectosV3.tsx"));
const ProyectoDetalleV2 = React.lazy(() => import("./pages/ProyectoDetalleV2.tsx"));
const Contacto = React.lazy(() => import("./pages/Contacto.tsx"));

const queryClient = new QueryClient();

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<V7 />} />
        <Route path="/index" element={<Index />} />
        <Route path="/v2" element={<V2 />} />
        <Route path="/v3" element={<V3 />} />
        <Route path="/v4" element={<V4 />} />
        <Route path="/v5" element={<V5 />} />
        <Route path="/v6" element={<V6 />} />
        <Route path="/v7" element={<V7 />} />
        <Route path="/proyectos" element={<ProyectosV2 />} />
        <Route path="/proyectos/v2" element={<ProyectosV2 />} />
        <Route path="/proyectos/v3" element={<ProyectosV3 />} />
        <Route path="/proyectos/v2/:slug" element={<ProyectoDetalleV2 />} />
        <Route path="/proyectos/v3/:slug" element={<ProyectoDetalleV2 />} />
        <Route path="/proyectos/:slug" element={<ProyectoDetalleV2 />} />
        <Route path="/contacto" element={<Contacto />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SmoothScrollProvider>
            <Suspense fallback={<Preloader onComplete={() => {}} />}>
              <AnimatedRoutes />
            </Suspense>
          </SmoothScrollProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
    <Analytics />
  </HelmetProvider>
);

export default App;
