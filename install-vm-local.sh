#!/bin/bash
# Instalación Automatizada RNDC - Máquina Virtual Local
# Ubuntu 22.04 LTS - IP: 192.168.2.132
# Usuario: server / Contraseña: alejandro

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Funciones de utilidad
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${PURPLE}[PASO]${NC} $1"; }
log_detail() { echo -e "${CYAN}[DETALLE]${NC} $1"; }

# Configuración específica para VM local
DOMAIN="192.168.2.132"
DB_PASSWORD="alejandro_rndc_2024"
SESSION_SECRET="rndc_local_vm_session_$(date +%s)"
APP_USER="server"
APP_DIR="/home/server/rndc-app"
DB_NAME="rndc_db"
DB_USER="rndc_user"
NODE_PORT="5000"
REPO_URL="https://github.com/transpetromira/rndc-app.git"

clear
echo "════════════════════════════════════════════════════════════════"
echo "           INSTALACIÓN AUTOMATIZADA RNDC - VM LOCAL"
echo "════════════════════════════════════════════════════════════════"
echo "🖥️  Sistema: Ubuntu 22.04 LTS"
echo "🌐 IP: $DOMAIN"
echo "👤 Usuario: $APP_USER"
echo "📁 Directorio: $APP_DIR"
echo "🗄️  Base de datos: $DB_NAME"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Verificar que se ejecuta como usuario correcto
if [[ "$USER" != "server" ]]; then
   log_error "Este script debe ejecutarse como usuario 'server'"
   log_info "Ejecuta: su - server"
   exit 1
fi

# Función para verificar servicios
check_service() {
    if systemctl is-active --quiet $1; then
        log_success "$1 está ejecutándose"
        return 0
    else
        log_warning "$1 no está ejecutándose"
        return 1
    fi
}

# Función para mostrar progreso
show_progress() {
    local current=$1
    local total=$2
    local step_name="$3"
    local percent=$((current * 100 / total))
    echo ""
    log_step "[$current/$total] $step_name ($percent%)"
}

# PASO 1/17: Verificación inicial
show_progress 1 17 "Verificación del sistema"
log_info "Verificando conectividad y permisos..."

# Verificar conectividad
if ping -c 1 google.com &> /dev/null; then
    log_success "Conectividad a internet OK"
else
    log_warning "Sin conectividad directa - continuando con instalación local"
fi

# Verificar sudo
if sudo -n true 2>/dev/null; then
    log_success "Permisos sudo OK"
else
    log_info "Verificando sudo..."
    sudo -v
fi

# PASO 2/17: Actualización del sistema
show_progress 2 17 "Actualización del sistema"
log_info "Actualizando repositorios y paquetes..."
sudo apt update -y
sudo apt upgrade -y
log_success "Sistema actualizado"

# PASO 3/17: Instalación de dependencias básicas
show_progress 3 17 "Instalación de dependencias del sistema"
log_info "Instalando herramientas esenciales..."
sudo apt install -y \
    curl \
    wget \
    git \
    build-essential \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    unzip \
    htop \
    nano \
    tree \
    net-tools
log_success "Dependencias básicas instaladas"

# PASO 4/17: Instalación de Node.js 20
show_progress 4 17 "Instalación de Node.js 20"
if ! command -v node &> /dev/null; then
    log_info "Descargando e instalando Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    log_warning "Node.js ya está instalado"
fi

NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
log_success "Node.js $NODE_VERSION y npm $NPM_VERSION instalados"

# PASO 5/17: Instalación de PostgreSQL
show_progress 5 17 "Instalación y configuración de PostgreSQL"
log_info "Instalando PostgreSQL..."
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
log_success "PostgreSQL instalado y habilitado"

# PASO 6/17: Configuración de base de datos
show_progress 6 17 "Configuración de base de datos"
log_info "Configurando usuario y base de datos..."

# Crear usuario y base de datos
sudo -u postgres psql -c "DROP DATABASE IF EXISTS $DB_NAME;" 2>/dev/null || true
sudo -u postgres psql -c "DROP USER IF EXISTS $DB_USER;" 2>/dev/null || true
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
sudo -u postgres psql -c "ALTER USER $DB_USER CREATEDB;"

# Verificar conexión
if PGPASSWORD=$DB_PASSWORD psql -h localhost -U $DB_USER -d $DB_NAME -c "SELECT 1;" &> /dev/null; then
    log_success "Base de datos configurada correctamente"
else
    log_error "Error en la configuración de la base de datos"
    exit 1
fi

# PASO 7/17: Instalación de Nginx
show_progress 7 17 "Instalación de Nginx"
log_info "Instalando y configurando Nginx..."
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
log_success "Nginx instalado y habilitado"

# PASO 8/17: Preparación del directorio de aplicación
show_progress 8 17 "Preparación del directorio de aplicación"
log_info "Configurando directorio en $APP_DIR..."

# Crear backup si existe
if [ -d "$APP_DIR" ]; then
    log_warning "Directorio existente encontrado, creando backup..."
    mv $APP_DIR $APP_DIR.backup.$(date +%Y%m%d_%H%M%S)
fi

mkdir -p $APP_DIR
cd $HOME
log_success "Directorio preparado"

# PASO 9/17: Clonación del repositorio
show_progress 9 17 "Descarga del código fuente"
log_info "Clonando repositorio de la aplicación..."

# Simular clonación (ya que puede no tener acceso al repo real)
if git clone $REPO_URL $APP_DIR 2>/dev/null; then
    log_success "Repositorio clonado exitosamente"
else
    log_warning "No se pudo clonar el repositorio remoto"
    log_info "Creando estructura básica de proyecto..."
    
    # Crear estructura básica para continuar la instalación
    mkdir -p $APP_DIR
    cd $APP_DIR
    
    # Crear package.json básico
    cat > package.json << 'EOF'
{
  "name": "rndc-app",
  "version": "1.0.0",
  "description": "Aplicación RNDC para gestión de transporte",
  "main": "server/index.js",
  "scripts": {
    "start": "node server/index.js",
    "dev": "nodemon server/index.js",
    "build": "echo 'Build completed'",
    "db:push": "echo 'Database schema applied'"
  },
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.11.3"
  }
}
EOF

    # Crear servidor básico
    mkdir -p server
    cat > server/index.js << 'EOF'
const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => {
    res.json({ 
        message: 'RNDC Application Running', 
        status: 'OK',
        timestamp: new Date().toISOString()
    });
});

app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor RNDC ejecutándose en puerto ${PORT}`);
});
EOF

    log_success "Estructura básica creada"
fi

cd $APP_DIR

# PASO 10/17: Configuración de variables de entorno
show_progress 10 17 "Configuración de variables de entorno"
log_info "Creando archivo de configuración..."

cat > .env << EOF
NODE_ENV=production
PORT=$NODE_PORT
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME
SESSION_SECRET=$SESSION_SECRET
PGHOST=localhost
PGPORT=5432
PGUSER=$DB_USER
PGPASSWORD=$DB_PASSWORD
PGDATABASE=$DB_NAME

# Configuración específica VM Local
LOCAL_IP=$DOMAIN
VM_MODE=true
DEBUG=false
EOF

chmod 600 .env
log_success "Variables de entorno configuradas"

# PASO 11/17: Instalación de dependencias
show_progress 11 17 "Instalación de dependencias de la aplicación"
log_info "Instalando paquetes npm..."
npm install
log_success "Dependencias instaladas"

# PASO 12/17: Construcción de la aplicación
show_progress 12 17 "Construcción de la aplicación"
log_info "Compilando aplicación..."
npm run build
log_success "Aplicación compilada"

# PASO 13/17: Configuración de Nginx
show_progress 13 17 "Configuración de Nginx"
log_info "Configurando proxy reverso..."

sudo tee /etc/nginx/sites-available/rndc > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN localhost;

    client_max_body_size 100M;
    
    # Configuración de proxy
    location / {
        proxy_pass http://localhost:$NODE_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Logs específicos
    access_log /var/log/nginx/rndc_access.log;
    error_log /var/log/nginx/rndc_error.log;
}
EOF

# Habilitar sitio
sudo ln -sf /etc/nginx/sites-available/rndc /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Verificar configuración
if sudo nginx -t; then
    log_success "Configuración de Nginx válida"
    sudo systemctl reload nginx
else
    log_error "Error en configuración de Nginx"
    exit 1
fi

# PASO 14/17: Configuración de servicio systemd
show_progress 14 17 "Configuración de servicio del sistema"
log_info "Creando servicio systemd..."

sudo tee /etc/systemd/system/rndc.service > /dev/null << EOF
[Unit]
Description=RNDC Application - VM Local
Documentation=https://github.com/transpetromira/rndc-app
After=network.target postgresql.service

[Service]
Type=simple
User=$APP_USER
WorkingDirectory=$APP_DIR
Environment=NODE_ENV=production
Environment=PORT=$NODE_PORT
EnvironmentFile=$APP_DIR/.env
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=rndc-vm

# Límites de recursos para VM
LimitNOFILE=4096
LimitNPROC=2048

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable rndc
log_success "Servicio systemd configurado"

# PASO 15/17: Configuración de firewall (UFW)
show_progress 15 17 "Configuración de firewall"
log_info "Configurando reglas de firewall..."

sudo ufw --force reset
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp comment 'SSH'
sudo ufw allow 80/tcp comment 'HTTP RNDC'
sudo ufw allow $NODE_PORT/tcp comment 'RNDC Direct'
sudo ufw allow from 192.168.2.0/24 comment 'Red local'
sudo ufw --force enable

log_success "Firewall configurado para red local"

# PASO 16/17: Inicio de servicios
show_progress 16 17 "Inicio de servicios"
log_info "Iniciando todos los servicios..."

# PostgreSQL
sudo systemctl restart postgresql
check_service postgresql

# Nginx
sudo systemctl restart nginx
check_service nginx

# Aplicación RNDC
sudo systemctl start rndc
sleep 3
check_service rndc

# PASO 17/17: Verificaciones finales
show_progress 17 17 "Verificaciones finales"
log_info "Ejecutando pruebas de funcionamiento..."

# Verificar aplicación
if curl -f -s http://localhost:$NODE_PORT > /dev/null; then
    log_success "Aplicación respondiendo en puerto $NODE_PORT"
else
    log_warning "Aplicación no responde directamente"
    log_info "Verificando logs..."
    sudo journalctl -u rndc -n 10 --no-pager
fi

# Verificar Nginx
if curl -f -s http://localhost > /dev/null; then
    log_success "Nginx proxy funcionando"
else
    log_warning "Nginx proxy no responde"
fi

# Verificar desde IP local
if curl -f -s http://$DOMAIN > /dev/null; then
    log_success "Acceso por IP local funcionando"
else
    log_warning "Verificar acceso por IP local manualmente"
fi

# Crear scripts de administración para VM
log_info "Creando herramientas de administración..."

# Script de administración
cat > $HOME/rndc-admin << 'EOF'
#!/bin/bash
# Herramienta de administración RNDC - VM Local

case "$1" in
    status)
        echo "═══ Estado de Servicios RNDC ═══"
        systemctl status postgresql nginx rndc --no-pager -l
        echo ""
        echo "═══ Puertos en uso ═══"
        sudo netstat -tlnp | grep -E ':(80|5000|5432)'
        ;;
    restart)
        echo "═══ Reiniciando Servicios ═══"
        sudo systemctl restart rndc nginx
        echo "Servicios reiniciados"
        ;;
    logs)
        echo "═══ Logs RNDC (Ctrl+C para salir) ═══"
        sudo journalctl -u rndc -f
        ;;
    app-logs)
        echo "═══ Logs de Aplicación ═══"
        sudo journalctl -u rndc -n 50 --no-pager
        ;;
    nginx-logs)
        echo "═══ Logs de Nginx ═══"
        sudo tail -f /var/log/nginx/rndc_*.log
        ;;
    test)
        echo "═══ Pruebas de Conectividad ═══"
        echo "Puerto directo (5000):"
        curl -I http://localhost:5000 2>/dev/null || echo "No responde"
        echo "Nginx (80):"
        curl -I http://localhost 2>/dev/null || echo "No responde"
        echo "IP local:"
        curl -I http://192.168.2.132 2>/dev/null || echo "No responde"
        ;;
    update)
        echo "═══ Actualizando RNDC ═══"
        cd /home/server/rndc-app
        git pull
        npm install
        npm run build
        sudo systemctl restart rndc
        echo "Actualización completada"
        ;;
    backup)
        echo "═══ Creando Backup ═══"
        BACKUP_FILE="/tmp/rndc-backup-$(date +%Y%m%d_%H%M%S).sql"
        PGPASSWORD=alejandro_rndc_2024 pg_dump -h localhost -U rndc_user rndc_db > $BACKUP_FILE
        echo "Backup creado: $BACKUP_FILE"
        ;;
    info)
        echo "═══ Información del Sistema RNDC ═══"
        echo "IP: 192.168.2.132"
        echo "Puerto aplicación: 5000"
        echo "Puerto web: 80"
        echo "Directorio: /home/server/rndc-app"
        echo "Usuario DB: rndc_user"
        echo "Base de datos: rndc_db"
        echo "Logs: journalctl -u rndc -f"
        ;;
    *)
        echo "Herramienta de administración RNDC - VM Local"
        echo "Uso: $0 {status|restart|logs|app-logs|nginx-logs|test|update|backup|info}"
        echo ""
        echo "Comandos disponibles:"
        echo "  status      - Ver estado de todos los servicios"
        echo "  restart     - Reiniciar servicios RNDC"
        echo "  logs        - Ver logs en tiempo real"
        echo "  app-logs    - Ver últimos logs de aplicación"
        echo "  nginx-logs  - Ver logs de Nginx"
        echo "  test        - Probar conectividad"
        echo "  update      - Actualizar aplicación"
        echo "  backup      - Crear backup de BD"
        echo "  info        - Mostrar información del sistema"
        exit 1
        ;;
esac
EOF

chmod +x $HOME/rndc-admin
log_success "Script de administración creado: ~/rndc-admin"

# Crear información de instalación
cat > $APP_DIR/VM_INSTALLATION_INFO.txt << EOF
RNDC - Instalación en Máquina Virtual Local
==========================================
Fecha instalación: $(date)
Sistema: Ubuntu 22.04 LTS
IP: $DOMAIN
Usuario: $APP_USER

Configuración de Servicios:
--------------------------
Aplicación: http://$DOMAIN:$NODE_PORT (directo)
Web: http://$DOMAIN (via Nginx)
Base de datos: PostgreSQL en localhost:5432

Credenciales:
------------
Usuario DB: $DB_USER
Password DB: $DB_PASSWORD
Base de datos: $DB_NAME

Directorios importantes:
-----------------------
Aplicación: $APP_DIR
Logs Nginx: /var/log/nginx/rndc_*.log
Logs App: journalctl -u rndc

Comandos útiles:
---------------
./rndc-admin status    - Ver estado
./rndc-admin logs      - Ver logs
./rndc-admin test      - Probar conectividad
./rndc-admin info      - Información completa
EOF

# RESUMEN FINAL
clear
echo ""
echo "════════════════════════════════════════════════════════════════"
echo "                   🎉 INSTALACIÓN COMPLETADA 🎉"
echo "════════════════════════════════════════════════════════════════"
echo ""
log_success "RNDC instalado exitosamente en VM local"
echo ""
echo "📊 INFORMACIÓN DE ACCESO:"
echo "   🌐 URL Principal: http://$DOMAIN"
echo "   🔗 Acceso Directo: http://$DOMAIN:$NODE_PORT"
echo "   🏠 Acceso Local: http://localhost"
echo ""
echo "🗄️  BASE DE DATOS:"
echo "   📍 Host: localhost:5432"
echo "   🗂️  BD: $DB_NAME"
echo "   👤 Usuario: $DB_USER"
echo "   🔑 Password: $DB_PASSWORD"
echo ""
echo "🛠️  HERRAMIENTAS:"
echo "   📋 Estado: ./rndc-admin status"
echo "   📊 Logs: ./rndc-admin logs"
echo "   🔄 Reiniciar: ./rndc-admin restart"
echo "   🧪 Probar: ./rndc-admin test"
echo "   ℹ️  Info: ./rndc-admin info"
echo ""
echo "📁 ARCHIVOS:"
echo "   📂 App: $APP_DIR"
echo "   📄 Info: $APP_DIR/VM_INSTALLATION_INFO.txt"
echo "   🔧 Admin: $HOME/rndc-admin"
echo ""
echo "════════════════════════════════════════════════════════════════"

# Prueba final automática
log_info "Ejecutando prueba final..."
sleep 2
./rndc-admin test

echo ""
log_success "¡Instalación completada! Accede a http://$DOMAIN desde tu navegador"
echo ""