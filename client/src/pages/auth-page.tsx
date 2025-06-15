import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Truck, LogIn, UserPlus } from "lucide-react";
import { Redirect } from "wouter";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [registerData, setRegisterData] = useState({
    username: "",
    password: "",
    nombre: "",
    email: "",
  });

  // Redirect if already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(loginData);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate(registerData);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Auth forms */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Truck className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Sistema RNDC</h1>
            <p className="text-muted-foreground">
              Gestión de transporte y manifiestos de carga
            </p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
              <TabsTrigger value="register">Registrarse</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LogIn className="h-5 w-5" />
                    Iniciar Sesión
                  </CardTitle>
                  <CardDescription>
                    Ingresa tus credenciales para acceder al sistema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Usuario</Label>
                      <Input
                        id="username"
                        type="text"
                        value={loginData.username}
                        onChange={(e) =>
                          setLoginData({ ...loginData, username: e.target.value })
                        }
                        placeholder="Nombre de usuario"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Contraseña</Label>
                      <Input
                        id="password"
                        type="password"
                        value={loginData.password}
                        onChange={(e) =>
                          setLoginData({ ...loginData, password: e.target.value })
                        }
                        placeholder="Contraseña"
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? "Iniciando..." : "Iniciar Sesión"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    Crear Cuenta
                  </CardTitle>
                  <CardDescription>
                    Crea una nueva cuenta para acceder al sistema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reg-username">Usuario</Label>
                      <Input
                        id="reg-username"
                        type="text"
                        value={registerData.username}
                        onChange={(e) =>
                          setRegisterData({ ...registerData, username: e.target.value })
                        }
                        placeholder="Nombre de usuario"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-nombre">Nombre Completo</Label>
                      <Input
                        id="reg-nombre"
                        type="text"
                        value={registerData.nombre}
                        onChange={(e) =>
                          setRegisterData({ ...registerData, nombre: e.target.value })
                        }
                        placeholder="Nombre completo"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-email">Correo Electrónico</Label>
                      <Input
                        id="reg-email"
                        type="email"
                        value={registerData.email}
                        onChange={(e) =>
                          setRegisterData({ ...registerData, email: e.target.value })
                        }
                        placeholder="correo@ejemplo.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-password">Contraseña</Label>
                      <Input
                        id="reg-password"
                        type="password"
                        value={registerData.password}
                        onChange={(e) =>
                          setRegisterData({ ...registerData, password: e.target.value })
                        }
                        placeholder="Contraseña"
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? "Creando..." : "Crear Cuenta"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right side - Hero section */}
      <div className="flex-1 bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center p-8">
        <div className="text-center text-white space-y-6">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold">
              Sistema de Gestión RNDC
            </h2>
            <p className="text-xl text-primary-foreground/90">
              Plataforma especializada para el manejo de transporte y documentos de carga en Colombia
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-4 max-w-md mx-auto">
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <h3 className="font-semibold mb-2">Gestión de Manifiestos</h3>
              <p className="text-sm text-primary-foreground/80">
                Crea y administra manifiestos de carga cumpliendo con las regulaciones del RNDC
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <h3 className="font-semibold mb-2">Control de Vehículos</h3>
              <p className="text-sm text-primary-foreground/80">
                Administra tu flota de vehículos y conductores de manera eficiente
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <h3 className="font-semibold mb-2">Integración SOAP</h3>
              <p className="text-sm text-primary-foreground/80">
                Conexión directa con los servicios del Ministerio de Transporte
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}