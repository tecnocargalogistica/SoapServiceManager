import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import Dashboard from "@/pages/dashboard";
import GenerarRemesas from "@/pages/generar-remesas";
import GenerarManifiestos from "@/pages/generar-manifiestos";
import CumplirRemesas from "@/pages/cumplir-remesas";
import Cumplimiento from "@/pages/cumplimiento";
import CumplimientoDirecto from "@/pages/cumplimiento-directo";
import TestCumplimiento from "@/pages/test-cumplimiento";
import CumplimientoNuevo from "@/pages/cumplimiento-nuevo";
import ImpresionManifiestos from "@/pages/impresion-manifiestos";
import Configuracion from "@/pages/configuracion";
import GestionDatos from "@/pages/gestion-datos";
import SOAPCliente from "@/pages/soap-cliente";
import NotFound from "@/pages/not-found";

import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";

function Router() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <div className="flex-1 overflow-y-auto">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/generar-remesas" component={GenerarRemesas} />
            <Route path="/generar-manifiestos" component={GenerarManifiestos} />
            <Route path="/cumplir-remesas" component={CumplirRemesas} />
            <Route path="/cumplimiento" component={Cumplimiento} />
        <Route path="/cumplimiento-directo" component={CumplimientoDirecto} />
            <Route path="/cumplimiento-nuevo" component={CumplimientoNuevo} />
            <Route path="/test-cumplimiento" component={TestCumplimiento} />
            <Route path="/impresion-manifiestos" component={ImpresionManifiestos} />
            <Route path="/gestion-datos" component={GestionDatos} />
            <Route path="/soap-cliente" component={SOAPCliente} />
            <Route path="/configuracion" component={Configuracion} />
            <Route component={NotFound} />
          </Switch>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
