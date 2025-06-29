#!/bin/bash
# Instalación Automatizada Completa - Aplicación RNDC
# Ubuntu 22.04 LTS - Configuración de Producción
# Uso: ./deploy-setup.sh [REPO_URL] [DOMAIN] [DB_PASSWORD]

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funciones de utilidad
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Verificar que se ejecuta como usuario no-root con sudo
if [[ $EUID -eq 0 ]]; then
   log_error "No ejecutes este script como root. Usa un usuario con privilegios sudo."
   exit 1
fi

# Parámetros de configuración
REPO_URL=${1:-"https://github.com/tu-usuario/rndc-app.git"}
DOMAIN=${2:-$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)}
DB_PASSWORD=${3:-$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)}
SESSION_SECRET=$(openssl rand -base64 32)
APP_USER="ubuntu"
APP_DIR="/var/www/rndc"
DB_NAME="rndc_db"
DB_USER="rndc_user"

log_info "🚀 Iniciando instalación automatizada de RNDC"
log_info "📋 Configuración:"
log_info "   - Repositorio: $REPO_URL"
log_info "   - Dominio/IP: $DOMAIN"
log_info "   - Directorio: $APP_DIR"
log_info "   - Usuario DB: $DB_USER"

# Función para verificar si un servicio está corriendo
check_service() {
    if systemctl is-active --quiet $1; then
        log_success "$1 está ejecutándose"
        return 0
    else
        log_error "$1 no está ejecutándose"
        return 1
    fi
}

# Función para crear backup si existe instalación previa
backup_existing() {
    if [ -d "$APP_DIR" ]; then
        log_warning "Instalación existente detectada. Creando backup..."
        sudo cp -r $APP_DIR $APP_DIR.backup.$(date +%Y%m%d_%H%M%S)
        log_success "Backup creado"
    fi
}

# 1. ACTUALIZACIÓN DEL SISTEMA
log_info "📦 Actualizando sistema Ubuntu..."
sudo apt update -y
sudo apt upgrade -y
log_success "Sistema actualizado"

# 2. INSTALACIÓN DE DEPENDENCIAS
log_info "🔧 Instalando dependencias del sistema..."
sudo apt install -y \
    curl \
    wget \
    git \
    nginx \
    postgresql \
    postgresql-contrib \
    build-essential \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    ufw \
    htop \
    unzip
log_success "Dependencias instaladas"

# 3. INSTALACIÓN DE NODE.JS 20
log_info "📦 Instalando Node.js 20..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    log_warning "Node.js ya está instalado"
fi

# Verificar versiones
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
log_success "Node.js $NODE_VERSION y npm $NPM_VERSION instalados"

# 4. CONFIGURACIÓN DE POSTGRESQL
log_info "🗄️ Configurando PostgreSQL..."
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Crear usuario y base de datos
log_info "📊 Configurando base de datos..."
sudo -u postgres psql -c "DROP DATABASE IF EXISTS $DB_NAME;" || true
sudo -u postgres psql -c "DROP USER IF EXISTS $DB_USER;" || true
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
sudo -u postgres psql -c "ALTER USER $DB_USER CREATEDB;"

# Verificar conexión a la base de datos
if PGPASSWORD=$DB_PASSWORD psql -h localhost -U $DB_USER -d $DB_NAME -c "SELECT 1;" &> /dev/null; then
    log_success "Base de datos configurada correctamente"
else
    log_error "Error en la configuración de la base de datos"
    exit 1
fi

# 5. CONFIGURACIÓN DE DIRECTORIO DE APLICACIÓN
log_info "📁 Preparando directorio de aplicación..."
backup_existing
sudo rm -rf $APP_DIR
sudo mkdir -p $APP_DIR
sudo chown -R $APP_USER:$APP_USER $APP_DIR

# 6. CLONACIÓN DEL REPOSITORIO
log_info "📥 Clonando repositorio..."
cd /tmp
if [ -d "rndc-temp" ]; then
    rm -rf rndc-temp
fi
git clone $REPO_URL rndc-temp
sudo cp -r rndc-temp/* $APP_DIR/
sudo chown -R $APP_USER:$APP_USER $APP_DIR
rm -rf rndc-temp
log_success "Repositorio clonado"

# 7. CONFIGURACIÓN DE VARIABLES DE ENTORNO
log_info "🔧 Configurando variables de entorno..."
cd $APP_DIR
cat > .env << EOF
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME
SESSION_SECRET=$SESSION_SECRET
PGHOST=localhost
PGPORT=5432
PGUSER=$DB_USER
PGPASSWORD=$DB_PASSWORD
PGDATABASE=$DB_NAME
EOF

sudo chown $APP_USER:$APP_USER .env
sudo chmod 600 .env
log_success "Variables de entorno configuradas"

# 8. INSTALACIÓN DE DEPENDENCIAS NPM
log_info "📦 Instalando dependencias de la aplicación..."
cd $APP_DIR
npm install --production
log_success "Dependencias instaladas"

# 9. CONSTRUCCIÓN DE LA APLICACIÓN
log_info "🏗️ Construyendo aplicación..."
npm run build
log_success "Aplicación construida"

# 10. INICIALIZACIÓN DE BASE DE DATOS
log_info "🗄️ Inicializando esquema de base de datos..."
npm run db:push
log_success "Base de datos inicializada"

# 11. CONFIGURACIÓN DE NGINX
log_info "🌐 Configurando Nginx..."
sudo tee /etc/nginx/sites-available/rndc > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN;

    client_max_body_size 50M;
    
    location / {
        proxy_pass http://localhost:5000;
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

    # Servir archivos estáticos
    location /assets/ {
        alias $APP_DIR/client/dist/assets/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Logs
    access_log /var/log/nginx/rndc_access.log;
    error_log /var/log/nginx/rndc_error.log;
}
EOF

# Habilitar sitio y deshabilitar default
sudo ln -sf /etc/nginx/sites-available/rndc /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Verificar configuración de Nginx
if sudo nginx -t; then
    log_success "Configuración de Nginx válida"
else
    log_error "Error en configuración de Nginx"
    exit 1
fi

# 12. CONFIGURACIÓN DE SERVICIO SYSTEMD
log_info "🔄 Configurando servicio systemd..."
sudo tee /etc/systemd/system/rndc.service > /dev/null << EOF
[Unit]
Description=RNDC Application
Documentation=https://github.com/transpetromira/rndc-app
After=network.target postgresql.service

[Service]
Type=simple
User=$APP_USER
WorkingDirectory=$APP_DIR
Environment=NODE_ENV=production
Environment=PORT=5000
EnvironmentFile=$APP_DIR/.env
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=rndc-app

# Límites de recursos
LimitNOFILE=65536
LimitNPROC=4096

[Install]
WantedBy=multi-user.target
EOF

# Recargar systemd y habilitar servicio
sudo systemctl daemon-reload
sudo systemctl enable rndc
log_success "Servicio systemd configurado"

# 13. CONFIGURACIÓN DEL FIREWALL
log_info "🔒 Configurando firewall..."
sudo ufw --force reset
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp comment 'SSH'
sudo ufw allow 80/tcp comment 'HTTP'
sudo ufw allow 443/tcp comment 'HTTPS'
sudo ufw --force enable
log_success "Firewall configurado"

# 14. INICIO DE SERVICIOS
log_info "🚀 Iniciando servicios..."

# Iniciar PostgreSQL
sudo systemctl restart postgresql
check_service postgresql

# Iniciar Nginx
sudo systemctl restart nginx
check_service nginx

# Iniciar aplicación
sudo systemctl start rndc
sleep 5
check_service rndc

# 15. VERIFICACIÓN FINAL
log_info "🔍 Ejecutando verificaciones finales..."

# Verificar que la aplicación responde
if curl -f -s http://localhost:5000 > /dev/null; then
    log_success "Aplicación respondiendo en puerto 5000"
else
    log_error "Aplicación no responde en puerto 5000"
    log_info "Verificando logs..."
    sudo journalctl -u rndc -n 20 --no-pager
fi

# Verificar Nginx
if curl -f -s http://localhost > /dev/null; then
    log_success "Nginx funcionando correctamente"
else
    log_error "Nginx no está funcionando"
fi

# 16. CREAR SCRIPT DE ADMINISTRACIÓN
log_info "🛠️ Creando scripts de administración..."
sudo tee /usr/local/bin/rndc-admin > /dev/null << 'EOF'
#!/bin/bash
# Script de administración RNDC

case "$1" in
    status)
        echo "=== Estado de Servicios RNDC ==="
        systemctl status postgresql nginx rndc --no-pager -l
        ;;
    restart)
        echo "=== Reiniciando Servicios RNDC ==="
        sudo systemctl restart rndc nginx
        echo "Servicios reiniciados"
        ;;
    logs)
        echo "=== Logs de RNDC ==="
        sudo journalctl -u rndc -f
        ;;
    update)
        echo "=== Actualizando RNDC ==="
        cd /var/www/rndc
        git pull
        npm install --production
        npm run build
        sudo systemctl restart rndc
        echo "Actualización completada"
        ;;
    backup)
        echo "=== Creando Backup ==="
        pg_dump -h localhost -U rndc_user rndc_db > /tmp/rndc-backup-$(date +%Y%m%d_%H%M%S).sql
        echo "Backup creado en /tmp/"
        ;;
    *)
        echo "Uso: $0 {status|restart|logs|update|backup}"
        exit 1
        ;;
esac
EOF

sudo chmod +x /usr/local/bin/rndc-admin
log_success "Script de administración creado: /usr/local/bin/rndc-admin"

# 17. RESUMEN FINAL
log_success "🎉 ¡INSTALACIÓN COMPLETADA!"
echo ""
echo "==============================================="
echo "       RESUMEN DE INSTALACIÓN RNDC"
echo "==============================================="
echo "🌐 URL de acceso: http://$DOMAIN"
echo "📁 Directorio: $APP_DIR"
echo "🗄️ Base de datos: $DB_NAME"
echo "👤 Usuario DB: $DB_USER"
echo "🔑 Contraseña DB: $DB_PASSWORD"
echo ""
echo "==============================================="
echo "           COMANDOS ÚTILES"
echo "==============================================="
echo "📊 Ver estado:      rndc-admin status"
echo "🔄 Reiniciar:       rndc-admin restart"
echo "📋 Ver logs:        rndc-admin logs"
echo "⬆️  Actualizar:      rndc-admin update"
echo "💾 Backup:          rndc-admin backup"
echo ""
echo "==============================================="
echo "        INFORMACIÓN ADICIONAL"
echo "==============================================="
echo "📝 Logs Nginx:      /var/log/nginx/rndc_*.log"
echo "📝 Logs App:        journalctl -u rndc -f"
echo "🔧 Config Nginx:    /etc/nginx/sites-available/rndc"
echo "🔧 Servicio:        /etc/systemd/system/rndc.service"
echo "🔧 Variables:       $APP_DIR/.env"
echo ""

# Guardar información de instalación
cat > $APP_DIR/INSTALLATION_INFO.txt << EOF
RNDC Installation Information
=============================
Date: $(date)
Domain: $DOMAIN
Database: $DB_NAME
DB User: $DB_USER
DB Password: $DB_PASSWORD
Session Secret: $SESSION_SECRET
Repository: $REPO_URL
EOF

log_success "✅ Información de instalación guardada en $APP_DIR/INSTALLATION_INFO.txt"
log_warning "⚠️  IMPORTANTE: Guarda la contraseña de la base de datos en un lugar seguro"
log_info "🔗 Accede a tu aplicación en: http://$DOMAIN"
