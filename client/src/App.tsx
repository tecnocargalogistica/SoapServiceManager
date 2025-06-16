import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import AuthPage from "@/pages/auth-page";

import Dashboard from "@/pages/dashboard";
import GenerarRemesas from "@/pages/generar-remesas";
import GenerarManifiestos from "@/pages/generar-manifiestos";
import CumplirRemesas from "@/pages/cumplir-remesas";
import Cumplimiento from "@/pages/cumplimiento";
import CumplimientoDirecto from "@/pages/cumplimiento-directo";
import TestCumplimiento from "@/pages/test-cumplimiento";
import CumplimientoNuevo from "@/pages/cumplimiento-nuevo";
import ImpresionManifiestos from "@/pages/impresion-manifiestos";
import PrototipoManifiesto from "@/pages/prototipo-manifiesto";
import TestPDFManifiesto from "@/pages/test-pdf-manifiesto";
import TestPDFPlantilla from "@/pages/test-pdf-plantilla";
import Consultas from "@/pages/consultas";
import CargaVehiculos from "@/pages/carga-vehiculos";
import CargaSedes from "@/pages/carga-sedes";
import CargaTerceros from "@/pages/carga-terceros";
import CargaMunicipios from "@/pages/carga-municipios";

import Configuracion from "@/pages/configuracion";
import GestionDatos from "@/pages/gestion-datos";
import ConsultasMaestros from "@/pages/consultas-maestros";
import SOAPCliente from "@/pages/soap-cliente";
import Logs from "@/pages/logs";
import NotFound from "@/pages/not-found";

import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";

function Router() {
  return (
    <AuthProvider>
      <Switch>
        <Route path="/auth" component={AuthPage} />
        <ProtectedRoute path="/" component={MainApp} />
        <ProtectedRoute path="/generar-remesas" component={GenerarRemesas} />
        <ProtectedRoute path="/generar-manifiestos" component={GenerarManifiestos} />
        <ProtectedRoute path="/cumplir-remesas" component={CumplirRemesas} />
        <ProtectedRoute path="/cumplimiento" component={Cumplimiento} />
        <ProtectedRoute path="/cumplimiento-directo" component={CumplimientoDirecto} />
        <ProtectedRoute path="/cumplimiento-nuevo" component={CumplimientoNuevo} />
        <ProtectedRoute path="/test-cumplimiento" component={TestCumplimiento} />
        <ProtectedRoute path="/impresion-manifiestos" component={ImpresionManifiestos} />
        <ProtectedRoute path="/prototipo-manifiesto" component={PrototipoManifiesto} />
        <ProtectedRoute path="/test-pdf-manifiesto" component={TestPDFManifiesto} />
        <ProtectedRoute path="/test-pdf-plantilla" component={TestPDFPlantilla} />
        <ProtectedRoute path="/consultas" component={Consultas} />
        <ProtectedRoute path="/carga-vehiculos" component={CargaVehiculos} />
        <ProtectedRoute path="/carga-sedes" component={CargaSedes} />
        <ProtectedRoute path="/carga-terceros" component={CargaTerceros} />
        <ProtectedRoute path="/carga-municipios" component={CargaMunicipios} />
        <ProtectedRoute path="/gestion-datos" component={GestionDatos} />
        <ProtectedRoute path="/consultas-maestros" component={ConsultasMaestros} />
        <ProtectedRoute path="/soap-cliente" component={SOAPCliente} />
        <ProtectedRoute path="/logs" component={Logs} />
        <ProtectedRoute path="/configuracion" component={Configuracion} />
        <Route component={NotFound} />
      </Switch>
    </AuthProvider>
  );
}

function MainApp() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <div className="flex-1 overflow-y-auto">
          <Dashboard />
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
