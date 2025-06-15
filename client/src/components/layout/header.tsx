import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wifi, WifiOff, HelpCircle, LogOut, User } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function Header() {
  const { user, logoutMutation } = useAuth();
  const { data: connectionStatus } = useQuery({
    queryKey: ["/api/rndc/test"],
    refetchInterval: 30000
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-1">
            <span>Sistema RNDC</span>
          </nav>
          <h2 className="text-2xl font-bold text-gray-900">Panel de Control</h2>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Connection Status */}
          <Badge 
            variant={connectionStatus?.connected ? "default" : "destructive"}
            className={connectionStatus?.connected ? "bg-emerald-500" : ""}
          >
            {connectionStatus?.connected ? (
              <>
                <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                <Wifi className="h-3 w-3 mr-1" />
                RNDC Conectado
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3 mr-1" />
                RNDC Desconectado
              </>
            )}
          </Badge>

          {/* User Info */}
          {user && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <User className="h-4 w-4" />
              <span>{user.nombre}</span>
            </div>
          )}
          
          <Button variant="outline" size="sm">
            <HelpCircle className="h-4 w-4 mr-2" />
            Ayuda
          </Button>

          {/* Logout Button */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Salir
          </Button>
        </div>
      </div>
    </header>
  );
}
