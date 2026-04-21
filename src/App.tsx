import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import V2 from "./pages/V2.tsx";
import V3 from "./pages/V3.tsx";
import V4 from "./pages/V4.tsx";
import V5 from "./pages/V5.tsx";
import V6 from "./pages/V6.tsx";
import NotFound from "./pages/NotFound.tsx";
import Proyectos from "./pages/Proyectos.tsx";
import ProyectosV2 from "./pages/ProyectosV2.tsx";
import ProyectosV3 from "./pages/ProyectosV3.tsx";
import ProyectoDetalle from "./pages/ProyectoDetalle.tsx";
import ProyectoDetalleV2 from "./pages/ProyectoDetalleV2.tsx";
import Contacto from "./pages/Contacto.tsx";
import SmoothScrollProvider from "./components/SmoothScrollProvider";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SmoothScrollProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/v2" element={<V2 />} />
            <Route path="/v3" element={<V3 />} />
            <Route path="/v4" element={<V4 />} />
            <Route path="/v5" element={<V5 />} />
            <Route path="/v6" element={<V6 />} />
            <Route path="/proyectos" element={<Proyectos />} />
            <Route path="/proyectos/v2" element={<ProyectosV2 />} />
            <Route path="/proyectos/v3" element={<ProyectosV3 />} />
            <Route path="/proyectos/v2/:slug" element={<ProyectoDetalleV2 />} />
            <Route path="/proyectos/v3/:slug" element={<ProyectoDetalleV2 />} />
            <Route path="/proyectos/:slug" element={<ProyectoDetalle />} />
            <Route path="/contacto" element={<Contacto />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </SmoothScrollProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
