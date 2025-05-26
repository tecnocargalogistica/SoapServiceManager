import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  Truck, 
  BarChart3, 
  FileText, 
  ClipboardList, 
  CheckCircle, 
  Building, 
  Users, 
  MapPin, 
  Settings, 
  Hash, 
  History,
  User,
  LogOut
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3, section: "Principal" },
  { 
    section: "Operaciones por Lotes",
    items: [
      { name: "Generar Remesas", href: "/generar-remesas", icon: FileText },
      { name: "Generar Manifiestos", href: "/manifiestos", icon: ClipboardList },
      { name: "Cumplir Remesas", href: "/cumplir-remesas", icon: CheckCircle },
    ]
  },
  {
    section: "Gestión de Datos",
    items: [
      { name: "Gestión de Datos", href: "/gestion-datos", icon: Building },
    ]
  },
  {
    section: "Sistema",
    items: [
      { name: "Configuraciones", href: "/configuracion", icon: Settings },
      { name: "Consecutivos", href: "/consecutivos", icon: Hash },
      { name: "Log de Actividades", href: "/logs", icon: History },
    ]
  }
];

export default function Sidebar() {
  const [location] = useLocation();

  const renderNavItem = (item: any, isMainItem = false) => {
    const isActive = location === item.href;
    const Icon = item.icon;

    return (
      <Link key={item.href} href={item.href}>
        <a
          className={cn(
            "flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors",
            isActive
              ? "text-primary-600 bg-primary-50 border-l-4 border-primary-600"
              : "text-gray-700 hover:bg-gray-100",
            isMainItem && "mb-4"
          )}
        >
          <Icon className={cn("w-5 h-5", isActive ? "text-primary-600" : "text-gray-400")} />
          <span>{item.name}</span>
        </a>
      </Link>
    );
  };

  return (
    <aside className="w-80 bg-white shadow-lg border-r border-gray-200 flex flex-col">
      {/* Logo and Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
            <Truck className="text-white text-lg" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">RNDC</h1>
            <p className="text-sm text-gray-500">Sistema de Gestión</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {navigation.map((section, index) => {
            if (section.section === "Principal") {
              return renderNavItem(section, true);
            }

            return (
              <div key={section.section} className={index > 0 ? "pt-4" : ""}>
                <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  {section.section}
                </h3>
                <div className="space-y-1">
                  {section.items?.map((item) => renderNavItem(item))}
                </div>
              </div>
            );
          })}
        </div>
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
            <User className="text-white text-sm" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">Admin Usuario</p>
            <p className="text-xs text-gray-500">Administrador</p>
          </div>
          <button className="text-gray-400 hover:text-gray-600 transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
