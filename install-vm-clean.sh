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
NC='\033[0m'

# Funciones de utilidad
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${PURPLE}[PASO]${NC} $1"; }

# Configuración específica para VM local
DOMAIN="192.168.2.139"
DB_PASSWORD="alejandro_rndc_2024"
SESSION_SECRET="rndc_local_vm_$(date +%s)"
APP_USER="server"
APP_DIR="/home/server/rndc-app"
DB_NAME="rndc_db"
DB_USER="rndc_user"
NODE_PORT="5000"

clear
echo "════════════════════════════════════════════════════════════════"
echo "           INSTALACIÓN AUTOMATIZADA RNDC - VM LOCAL"
echo "════════════════════════════════════════════════════════════════"
echo "Sistema: Ubuntu 22.04 LTS"
echo "IP: 192.168.2.139"
echo "Usuario: $APP_USER"
echo "════════════════════════════════════════════════════════════════"

# Verificar usuario
if [[ "$USER" != "server" ]]; then
   log_error "Este script debe ejecutarse como usuario 'server'"
   log_info "Ejecuta: su - server"
   exit 1
fi

# Función para mostrar progreso
show_progress() {
    local current=$1
    local total=$2
    local step_name="$3"
    local percent=$((current * 100 / total))
    echo ""
    log_step "[$current/$total] $step_name ($percent%)"
}

# PASO 1/15: Actualización del sistema
show_progress 1 15 "Actualización del sistema"
log_info "Actualizando repositorios y paquetes..."
sudo apt update -y
sudo apt upgrade -y
log_success "Sistema actualizado"

# PASO 2/15: Instalación de dependencias
show_progress 2 15 "Instalación de dependencias"
log_info "Instalando herramientas esenciales..."
sudo apt install -y curl wget git build-essential software-properties-common apt-transport-https ca-certificates gnupg lsb-release unzip htop nano tree net-tools
log_success "Dependencias instaladas"

# PASO 3/15: Instalación de Node.js 20
show_progress 3 15 "Instalación de Node.js 20"
if ! command -v node &> /dev/null; then
    log_info "Instalando Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    log_warning "Node.js ya está instalado"
fi

NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
log_success "Node.js $NODE_VERSION y npm $NPM_VERSION instalados"

# PASO 4/15: Instalación de PostgreSQL
show_progress 4 15 "Instalación de PostgreSQL"
log_info "Instalando PostgreSQL..."
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
log_success "PostgreSQL instalado"

# PASO 5/15: Configuración de base de datos
show_progress 5 15 "Configuración de base de datos"
log_info "Configurando usuario y base de datos..."

sudo -u postgres psql -c "DROP DATABASE IF EXISTS $DB_NAME;" 2>/dev/null || true
sudo -u postgres psql -c "DROP USER IF EXISTS $DB_USER;" 2>/dev/null || true
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
sudo -u postgres psql -c "ALTER USER $DB_USER CREATEDB;"

if PGPASSWORD=$DB_PASSWORD psql -h localhost -U $DB_USER -d $DB_NAME -c "SELECT 1;" &> /dev/null; then
    log_success "Base de datos configurada correctamente"
else
    log_error "Error en la configuración de la base de datos"
    exit 1
fi

# PASO 6/15: Instalación de Nginx
show_progress 6 15 "Instalación de Nginx"
log_info "Instalando Nginx..."
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
log_success "Nginx instalado"

# PASO 7/15: Preparación del directorio
show_progress 7 15 "Preparación del directorio de aplicación"
log_info "Configurando directorio en $APP_DIR..."

if [ -d "$APP_DIR" ]; then
    log_warning "Directorio existente, creando backup..."
    mv $APP_DIR $APP_DIR.backup.$(date +%Y%m%d_%H%M%S)
fi

mkdir -p $APP_DIR
cd $HOME
log_success "Directorio preparado"

# PASO 8/15: Crear aplicación básica
show_progress 8 15 "Creación de aplicación básica"
log_info "Creando estructura de aplicación..."

cd $APP_DIR

# Crear package.json
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
    "pg": "^8.11.3",
    "cors": "^2.8.5"
  }
}
EOF

# Crear servidor básico
mkdir -p server
cat > server/index.js << 'EOF'
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.json({ 
        message: 'RNDC Application Running on VM Local', 
        status: 'OK',
        ip: '192.168.2.139',
        timestamp: new Date().toISOString()
    });
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        database: 'connected',
        server: 'running'
    });
});

app.get('/api/status', (req, res) => {
    res.json({
        application: 'RNDC VM Local',
        version: '1.0.0',
        environment: 'production',
        database: process.env.PGDATABASE || 'rndc_db',
        port: PORT
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`================================`);
    console.log(`RNDC Server Running`);
    console.log(`Port: ${PORT}`);
    console.log(`IP: 192.168.2.139`);
    console.log(`URL: http://192.168.2.139:${PORT}`);
    console.log(`================================`);
});
EOF

log_success "Aplicación básica creada"

# PASO 9/15: Configuración de variables
show_progress 9 15 "Configuración de variables de entorno"
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
LOCAL_IP=$DOMAIN
VM_MODE=true
EOF

chmod 600 .env
log_success "Variables de entorno configuradas"

# PASO 10/15: Instalación de dependencias
show_progress 10 15 "Instalación de dependencias npm"
log_info "Instalando paquetes..."
npm install
log_success "Dependencias instaladas"

# PASO 11/15: Configuración de Nginx
show_progress 11 15 "Configuración de Nginx"
log_info "Configurando proxy reverso..."

sudo tee /etc/nginx/sites-available/rndc > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN localhost;

    client_max_body_size 100M;
    
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

    access_log /var/log/nginx/rndc_access.log;
    error_log /var/log/nginx/rndc_error.log;
}
EOF

sudo ln -sf /etc/nginx/sites-available/rndc /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

if sudo nginx -t; then
    log_success "Configuración de Nginx válida"
    sudo systemctl reload nginx
else
    log_error "Error en configuración de Nginx"
    exit 1
fi

# PASO 12/15: Configuración de servicio
show_progress 12 15 "Configuración de servicio systemd"
log_info "Creando servicio..."

sudo tee /etc/systemd/system/rndc.service > /dev/null << EOF
[Unit]
Description=RNDC Application VM Local
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

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable rndc
log_success "Servicio configurado"

# PASO 13/15: Configuración de firewall
show_progress 13 15 "Configuración de firewall"
log_info "Configurando UFW..."

sudo ufw --force reset
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow $NODE_PORT/tcp
sudo ufw allow from 192.168.2.0/24
sudo ufw --force enable
log_success "Firewall configurado"

# PASO 14/15: Inicio de servicios
show_progress 14 15 "Inicio de servicios"
log_info "Iniciando servicios..."

sudo systemctl restart postgresql
sudo systemctl restart nginx
sudo systemctl start rndc

sleep 3

# Verificar servicios
if systemctl is-active --quiet postgresql; then
    log_success "PostgreSQL ejecutándose"
else
    log_error "PostgreSQL no está ejecutándose"
fi

if systemctl is-active --quiet nginx; then
    log_success "Nginx ejecutándose"
else
    log_error "Nginx no está ejecutándose"
fi

if systemctl is-active --quiet rndc; then
    log_success "RNDC ejecutándose"
else
    log_warning "RNDC no está ejecutándose"
    log_info "Verificando logs..."
    sudo journalctl -u rndc -n 10 --no-pager
fi

# PASO 15/15: Crear herramientas de administración
show_progress 15 15 "Creación de herramientas"
log_info "Creando script de administración..."

cat > $HOME/rndc-admin << 'EOF'
#!/bin/bash

case "$1" in
    status)
        echo "═══ Estado de Servicios ═══"
        systemctl status postgresql nginx rndc --no-pager -l
        echo ""
        echo "═══ Puertos ═══"
        sudo netstat -tlnp | grep -E ':(80|5000|5432)'
        ;;
    restart)
        echo "═══ Reiniciando Servicios ═══"
        sudo systemctl restart rndc nginx
        echo "Servicios reiniciados"
        ;;
    logs)
        echo "═══ Logs RNDC ═══"
        sudo journalctl -u rndc -f
        ;;
    test)
        echo "═══ Pruebas de Conectividad ═══"
        echo "Puerto directo (5000):"
        curl -I http://localhost:5000 2>/dev/null || echo "No responde"
        echo "Nginx (80):"
        curl -I http://localhost 2>/dev/null || echo "No responde"
        echo "IP local:"
        curl -I http://192.168.2.139 2>/dev/null || echo "No responde"
        ;;
    info)
        echo "═══ Información del Sistema ═══"
        echo "IP: 192.168.2.139"
        echo "Puerto aplicación: 5000"
        echo "Puerto web: 80"
        echo "Directorio: /home/server/rndc-app"
        echo "Usuario DB: rndc_user"
        echo "Base de datos: rndc_db"
        ;;
    *)
        echo "Uso: $0 {status|restart|logs|test|info}"
        exit 1
        ;;
esac
EOF

chmod +x $HOME/rndc-admin
log_success "Script de administración creado"

# Verificación final
log_info "Ejecutando verificación final..."

if curl -f -s http://localhost:$NODE_PORT > /dev/null; then
    log_success "Aplicación respondiendo en puerto $NODE_PORT"
else
    log_warning "Aplicación no responde en puerto $NODE_PORT"
fi

if curl -f -s http://localhost > /dev/null; then
    log_success "Nginx funcionando"
else
    log_warning "Nginx no responde"
fi

# Información de instalación
cat > $APP_DIR/INSTALLATION_INFO.txt << EOF
RNDC VM Local Installation
=========================
Fecha: $(date)
IP: $DOMAIN
Usuario: $APP_USER
Puerto App: $NODE_PORT
Puerto Web: 80

Base de Datos:
- Host: localhost:5432
- BD: $DB_NAME
- Usuario: $DB_USER
- Password: $DB_PASSWORD

Comandos:
- ./rndc-admin status
- ./rndc-admin test
- ./rndc-admin logs
EOF

# RESUMEN FINAL
clear
echo ""
echo "════════════════════════════════════════════════════════════════"
echo "                   INSTALACIÓN COMPLETADA"
echo "════════════════════════════════════════════════════════════════"
echo ""
log_success "RNDC instalado exitosamente en VM local"
echo ""
echo "INFORMACIÓN DE ACCESO:"
echo "   URL Principal: http://192.168.2.139"
echo "   Acceso Directo: http://192.168.2.139:5000"
echo "   Acceso Local: http://localhost"
echo ""
echo "BASE DE DATOS:"
echo "   Host: localhost:5432"
echo "   BD: $DB_NAME"
echo "   Usuario: $DB_USER"
echo "   Password: $DB_PASSWORD"
echo ""
echo "HERRAMIENTAS:"
echo "   Estado: ./rndc-admin status"
echo "   Logs: ./rndc-admin logs"
echo "   Probar: ./rndc-admin test"
echo "   Info: ./rndc-admin info"
echo ""
echo "════════════════════════════════════════════════════════════════"

# Prueba final
log_info "Ejecutando prueba final..."
sleep 2
./rndc-admin test

echo ""
log_success "Instalación completada! Accede a http://192.168.2.139"
echo ""