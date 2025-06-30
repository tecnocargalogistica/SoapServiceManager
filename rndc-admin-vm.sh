#!/bin/bash
# Script de Administración RNDC - VM Local 192.168.2.139

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Funciones de utilidad
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

case "$1" in
    status)
        echo "════════════════════════════════════════════════════════════════"
        echo "                    ESTADO DE SERVICIOS RNDC"
        echo "════════════════════════════════════════════════════════════════"
        echo ""
        
        log_info "Verificando servicios principales..."
        echo ""
        
        # PostgreSQL
        if systemctl is-active --quiet postgresql; then
            log_success "PostgreSQL: ACTIVO"
        else
            log_error "PostgreSQL: INACTIVO"
        fi
        
        # Nginx
        if systemctl is-active --quiet nginx; then
            log_success "Nginx: ACTIVO"
        else
            log_error "Nginx: INACTIVO"
        fi
        
        # RNDC Service (si existe)
        if systemctl list-units --type=service | grep -q rndc; then
            if systemctl is-active --quiet rndc; then
                log_success "Servicio RNDC: ACTIVO"
            else
                log_warning "Servicio RNDC: INACTIVO"
            fi
        else
            log_warning "Servicio RNDC: NO CONFIGURADO"
        fi
        
        echo ""
        log_info "Puertos en uso:"
        sudo netstat -tlnp | grep -E ':(80|5000|5432)' | while read line; do
            echo "  $line"
        done
        
        echo ""
        log_info "Procesos Node.js activos:"
        ps aux | grep node | grep -v grep || echo "  Ningún proceso Node.js activo"
        ;;
        
    restart)
        echo "════════════════════════════════════════════════════════════════"
        echo "                  REINICIANDO SERVICIOS RNDC"
        echo "════════════════════════════════════════════════════════════════"
        echo ""
        
        log_info "Reiniciando PostgreSQL..."
        sudo systemctl restart postgresql
        
        log_info "Reiniciando Nginx..."
        sudo systemctl restart nginx
        
        if systemctl list-units --type=service | grep -q rndc; then
            log_info "Reiniciando servicio RNDC..."
            sudo systemctl restart rndc
        fi
        
        # Si hay procesos Node.js manuales, intentar reiniciarlos
        if pgrep -f "node.*server" > /dev/null; then
            log_warning "Detectados procesos Node.js manuales, terminando..."
            pkill -f "node.*server" 2>/dev/null || true
            sleep 2
        fi
        
        echo ""
        log_success "Servicios reiniciados"
        ;;
        
    logs)
        echo "════════════════════════════════════════════════════════════════"
        echo "                      LOGS DEL SISTEMA"
        echo "════════════════════════════════════════════════════════════════"
        echo ""
        
        if systemctl list-units --type=service | grep -q rndc; then
            log_info "Mostrando logs del servicio RNDC (Ctrl+C para salir)..."
            sudo journalctl -u rndc -f
        else
            log_warning "Servicio RNDC no configurado, mostrando logs de Nginx y PostgreSQL"
            echo ""
            log_info "Logs recientes de Nginx:"
            sudo tail -20 /var/log/nginx/error.log 2>/dev/null || echo "No hay logs de Nginx"
            echo ""
            log_info "Logs recientes de PostgreSQL:"
            sudo journalctl -u postgresql -n 20 --no-pager
        fi
        ;;
        
    test)
        echo "════════════════════════════════════════════════════════════════"
        echo "                   PRUEBAS DE CONECTIVIDAD"
        echo "════════════════════════════════════════════════════════════════"
        echo ""
        
        log_info "Probando conectividad local..."
        echo ""
        
        # Puerto 5000 directo
        echo -n "Puerto 5000 (aplicación): "
        if curl -f -s -m 5 http://localhost:5000 > /dev/null 2>&1; then
            log_success "RESPONDE"
        else
            log_error "NO RESPONDE"
        fi
        
        # Puerto 80 (Nginx)
        echo -n "Puerto 80 (Nginx): "
        if curl -f -s -m 5 http://localhost > /dev/null 2>&1; then
            log_success "RESPONDE"
        else
            log_error "NO RESPONDE"
        fi
        
        # IP externa
        echo -n "IP externa (192.168.2.139): "
        if curl -f -s -m 5 http://192.168.2.139 > /dev/null 2>&1; then
            log_success "RESPONDE"
        else
            log_error "NO RESPONDE"
        fi
        
        echo ""
        log_info "Base de datos PostgreSQL:"
        if PGPASSWORD=alejandro_rndc_2024 psql -h localhost -U rndc_user -d rndc_db -c "SELECT 1;" &>/dev/null; then
            log_success "PostgreSQL: CONECTADO"
        else
            log_error "PostgreSQL: ERROR DE CONEXIÓN"
        fi
        
        echo ""
        log_info "Respuesta de la aplicación:"
        curl -s http://localhost:5000 2>/dev/null | head -5 || echo "No hay respuesta"
        ;;
        
    info)
        echo "════════════════════════════════════════════════════════════════"
        echo "                  INFORMACIÓN DEL SISTEMA"
        echo "════════════════════════════════════════════════════════════════"
        echo ""
        
        log_info "Configuración del sistema:"
        echo "  IP: 192.168.2.139"
        echo "  Puerto aplicación: 5000"
        echo "  Puerto web: 80"
        echo "  Usuario: server"
        echo "  Directorio: /home/server/rndc-app"
        echo ""
        
        log_info "Base de datos:"
        echo "  Host: localhost:5432"
        echo "  BD: rndc_db"
        echo "  Usuario: rndc_user"
        echo "  Password: alejandro_rndc_2024"
        echo ""
        
        log_info "Archivos de configuración:"
        echo "  Nginx: /etc/nginx/sites-available/rndc"
        echo "  Servicio: /etc/systemd/system/rndc.service"
        echo "  Variables: /home/server/rndc-app/.env"
        echo ""
        
        log_info "Versión del sistema:"
        echo "  OS: $(lsb_release -d 2>/dev/null | cut -f2 || echo 'Ubuntu')"
        echo "  Node.js: $(node --version 2>/dev/null || echo 'No instalado')"
        echo "  PostgreSQL: $(sudo -u postgres psql -c 'SELECT version();' 2>/dev/null | head -3 | tail -1 || echo 'No disponible')"
        ;;
        
    start)
        echo "════════════════════════════════════════════════════════════════"
        echo "                    INICIANDO APLICACIÓN"
        echo "════════════════════════════════════════════════════════════════"
        echo ""
        
        if [ -d "/home/server/rndc-app" ]; then
            cd /home/server/rndc-app
            log_info "Iniciando aplicación RNDC..."
            
            if [ -f "package.json" ]; then
                npm start &
                log_success "Aplicación iniciada en segundo plano"
                log_info "PID: $!"
                log_info "Verifica con: ps aux | grep node"
            else
                log_error "No se encuentra package.json en /home/server/rndc-app"
            fi
        else
            log_error "Directorio /home/server/rndc-app no existe"
        fi
        ;;
        
    stop)
        echo "════════════════════════════════════════════════════════════════"
        echo "                    DETENIENDO APLICACIÓN"
        echo "════════════════════════════════════════════════════════════════"
        echo ""
        
        log_info "Deteniendo procesos Node.js..."
        if pgrep -f "node" > /dev/null; then
            pkill -f "node" 2>/dev/null || true
            sleep 2
            log_success "Procesos Node.js detenidos"
        else
            log_warning "No hay procesos Node.js activos"
        fi
        
        if systemctl list-units --type=service | grep -q rndc; then
            log_info "Deteniendo servicio RNDC..."
            sudo systemctl stop rndc
        fi
        ;;
        
    *)
        echo "════════════════════════════════════════════════════════════════"
        echo "               HERRAMIENTA DE ADMINISTRACIÓN RNDC"
        echo "════════════════════════════════════════════════════════════════"
        echo ""
        echo "Uso: $0 {comando}"
        echo ""
        echo "Comandos disponibles:"
        echo "  status    - Ver estado de todos los servicios"
        echo "  restart   - Reiniciar servicios principales"
        echo "  logs      - Ver logs en tiempo real"
        echo "  test      - Probar conectividad y servicios"
        echo "  info      - Mostrar información del sistema"
        echo "  start     - Iniciar aplicación manualmente"
        echo "  stop      - Detener aplicación"
        echo ""
        echo "VM Local: 192.168.2.139"
        echo "Usuario: server"
        echo ""
        exit 1
        ;;
esac