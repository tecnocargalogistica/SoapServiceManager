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

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={() => <Layout><Dashboard /></Layout>} />
      <ProtectedRoute path="/generar-remesas" component={() => <Layout><GenerarRemesas /></Layout>} />
      <ProtectedRoute path="/generar-manifiestos" component={() => <Layout><GenerarManifiestos /></Layout>} />
      <ProtectedRoute path="/cumplir-remesas" component={() => <Layout><CumplirRemesas /></Layout>} />
      <ProtectedRoute path="/cumplimiento" component={() => <Layout><Cumplimiento /></Layout>} />
      <ProtectedRoute path="/cumplimiento-directo" component={() => <Layout><CumplimientoDirecto /></Layout>} />
      <ProtectedRoute path="/cumplimiento-nuevo" component={() => <Layout><CumplimientoNuevo /></Layout>} />
      <ProtectedRoute path="/test-cumplimiento" component={() => <Layout><TestCumplimiento /></Layout>} />
      <ProtectedRoute path="/impresion-manifiestos" component={() => <Layout><ImpresionManifiestos /></Layout>} />
      <ProtectedRoute path="/prototipo-manifiesto" component={() => <Layout><PrototipoManifiesto /></Layout>} />
      <ProtectedRoute path="/test-pdf-manifiesto" component={() => <Layout><TestPDFManifiesto /></Layout>} />
      <ProtectedRoute path="/test-pdf-plantilla" component={() => <Layout><TestPDFPlantilla /></Layout>} />
      <ProtectedRoute path="/consultas" component={() => <Layout><Consultas /></Layout>} />
      <ProtectedRoute path="/carga-vehiculos" component={() => <Layout><CargaVehiculos /></Layout>} />
      <ProtectedRoute path="/carga-sedes" component={() => <Layout><CargaSedes /></Layout>} />
      <ProtectedRoute path="/carga-terceros" component={() => <Layout><CargaTerceros /></Layout>} />
      <ProtectedRoute path="/carga-municipios" component={() => <Layout><CargaMunicipios /></Layout>} />
      <ProtectedRoute path="/gestion-datos" component={() => <Layout><GestionDatos /></Layout>} />
      <ProtectedRoute path="/consultas-maestros" component={() => <Layout><ConsultasMaestros /></Layout>} />
      <ProtectedRoute path="/soap-cliente" component={() => <Layout><SOAPCliente /></Layout>} />
      <ProtectedRoute path="/logs" component={() => <Layout><Logs /></Layout>} />
      <ProtectedRoute path="/configuracion" component={() => <Layout><Configuracion /></Layout>} />
      <Route component={NotFound} />
    </Switch>
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
