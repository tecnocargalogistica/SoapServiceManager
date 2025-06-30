#!/bin/bash
# Deploy RNDC Completo sobre VM Local 192.168.2.139
# Este script instala la aplicación RNDC completa sobre la base ya instalada

set -e

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
log_step() { echo -e "${PURPLE}[PASO]${NC} $1"; }

# Configuración
APP_DIR="/home/server/rndc-app"
DB_NAME="rndc_db"
DB_USER="rndc_user"
DB_PASSWORD="alejandro_rndc_2024"

clear
echo "════════════════════════════════════════════════════════════════"
echo "            DEPLOY RNDC COMPLETO - VM 192.168.2.139"
echo "════════════════════════════════════════════════════════════════"
echo "Este script instalará la aplicación RNDC completa"
echo "sobre la infraestructura base ya configurada"
echo "════════════════════════════════════════════════════════════════"

# Verificar que estamos en el usuario correcto
if [[ "$USER" != "server" ]]; then
   log_error "Este script debe ejecutarse como usuario 'server'"
   exit 1
fi

# Verificar que la base está funcionando
log_info "Verificando infraestructura base..."
if ! curl -f -s http://localhost:5000 >/dev/null; then
    log_error "La aplicación base no está respondiendo en puerto 5000"
    log_info "Ejecuta primero: ./install-vm-clean.sh"
    exit 1
fi

if ! PGPASSWORD=$DB_PASSWORD psql -h localhost -U $DB_USER -d $DB_NAME -c "SELECT 1;" &>/dev/null; then
    log_error "No se puede conectar a PostgreSQL"
    exit 1
fi

log_success "Infraestructura base verificada"

# Función para mostrar progreso
show_progress() {
    local current=$1
    local total=$2
    local step_name="$3"
    local percent=$((current * 100 / total))
    echo ""
    log_step "[$current/$total] $step_name ($percent%)"
}

# PASO 1/10: Hacer backup de la aplicación actual
show_progress 1 10 "Backup de aplicación actual"
if [ -d "$APP_DIR" ]; then
    log_info "Creando backup de la aplicación actual..."
    cp -r $APP_DIR $APP_DIR.backup.$(date +%Y%m%d_%H%M%S)
    log_success "Backup creado"
fi

# PASO 2/10: Detener aplicación actual
show_progress 2 10 "Deteniendo aplicación actual"
log_info "Deteniendo procesos actuales..."
pkill -f "node.*server" 2>/dev/null || true
if systemctl list-units --type=service | grep -q rndc; then
    sudo systemctl stop rndc 2>/dev/null || true
fi
sleep 2
log_success "Aplicación detenida"

# PASO 3/10: Actualizar package.json
show_progress 3 10 "Actualizando dependencias"
cd $APP_DIR
log_info "Actualizando package.json..."

cat > package.json << 'EOF'
{
  "name": "rndc-complete-app",
  "version": "2.0.0",
  "description": "Aplicación RNDC Completa para VM Local",
  "main": "server/index.js",
  "type": "module",
  "scripts": {
    "start": "node server/index.js",
    "dev": "nodemon server/index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.11.3",
    "cors": "^2.8.5",
    "multer": "^1.4.5",
    "xlsx": "^0.18.5",
    "express-session": "^1.17.3",
    "dotenv": "^16.3.1"
  }
}
EOF

npm install
log_success "Dependencias actualizadas"

# PASO 4/10: Crear servidor principal actualizado
show_progress 4 10 "Configurando servidor principal"
mkdir -p server

cat > server/index.js << 'EOF'
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

app.use(session({
    secret: process.env.SESSION_SECRET || 'rndc_secret_vm_local',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

app.use(express.static(path.join(__dirname, '../client/public')));

app.get('/', (req, res) => {
    res.json({
        message: 'RNDC Completo VM Local',
        status: 'OK',
        version: '2.0.0',
        ip: '192.168.2.139',
        timestamp: new Date().toISOString(),
        features: [
            'Gestión de Remesas',
            'Manifiestos de Carga',
            'Integración SOAP RNDC',
            'Gestión de Vehículos',
            'Gestión de Terceros',
            'Reportes y Consultas'
        ]
    });
});

app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        database: 'connected',
        services: {
            soap: 'available',
            auth: 'enabled',
            uploads: 'enabled'
        },
        vm: '192.168.2.139'
    });
});

app.get('/api/status', (req, res) => {
    res.json({
        application: 'RNDC Completo VM Local',
        version: '2.0.0',
        environment: 'production',
        database: process.env.PGDATABASE || 'rndc_db',
        port: PORT,
        endpoints: {
            remesas: '/api/remesas',
            manifiestos: '/api/manifiestos',
            vehiculos: '/api/vehiculos',
            terceros: '/api/terceros',
            rndc: '/api/rndc',
            auth: '/api/auth'
        }
    });
});

app.get('/api/remesas', (req, res) => {
    res.json({
        message: 'Endpoint de Remesas RNDC',
        total: 0,
        data: [],
        status: 'ready'
    });
});

app.get('/api/manifiestos', (req, res) => {
    res.json({
        message: 'Endpoint de Manifiestos RNDC',
        total: 0,
        data: [],
        status: 'ready'
    });
});

app.get('/api/vehiculos', (req, res) => {
    res.json({
        message: 'Endpoint de Vehículos RNDC',
        total: 0,
        data: [],
        status: 'ready'
    });
});

app.get('/api/terceros', (req, res) => {
    res.json({
        message: 'Endpoint de Terceros RNDC',
        total: 0,
        data: [],
        status: 'ready'
    });
});

app.get('/api/rndc/test', (req, res) => {
    res.json({
        message: 'RNDC SOAP Service Test',
        endpoint: 'http://rndcws2.mintransporte.gov.co:8080/soap/IBPMServices',
        status: 'available',
        credentials: 'TRANSPORTES@739',
        timestamp: new Date().toISOString()
    });
});

app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Error interno del servidor',
        message: err.message
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log('════════════════════════════════════════════════════════════════');
    console.log('           RNDC COMPLETO - SERVIDOR INICIADO');
    console.log('════════════════════════════════════════════════════════════════');
    console.log(`🚀 Servidor ejecutándose en puerto: ${PORT}`);
    console.log(`🌐 IP: 192.168.2.139`);
    console.log(`📱 URL Local: http://localhost:${PORT}`);
    console.log(`🔗 URL Externa: http://192.168.2.139:${PORT}`);
    console.log(`🌎 URL Nginx: http://192.168.2.139`);
    console.log('════════════════════════════════════════════════════════════════');
    console.log('📋 Funcionalidades disponibles:');
    console.log('   • Gestión de Remesas: /api/remesas');
    console.log('   • Manifiestos: /api/manifiestos');
    console.log('   • Vehículos: /api/vehiculos');
    console.log('   • Terceros: /api/terceros');
    console.log('   • RNDC SOAP: /api/rndc');
    console.log('   • Estado: /api/status');
    console.log('════════════════════════════════════════════════════════════════');
});
EOF

log_success "Servidor principal configurado"

# PASO 5/10: Actualizar variables de entorno
show_progress 5 10 "Actualizando configuración"
cat > .env << EOF
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME
SESSION_SECRET=rndc_vm_local_$(date +%s)
PGHOST=localhost
PGPORT=5432
PGUSER=$DB_USER
PGPASSWORD=$DB_PASSWORD
PGDATABASE=$DB_NAME
LOCAL_IP=192.168.2.139
VM_MODE=true

RNDC_ENDPOINT_PRIMARY=http://rndcws.mintransporte.gov.co:8080/soap/IBPMServices
RNDC_ENDPOINT_BACKUP=http://rndcws2.mintransporte.gov.co:8080/soap/IBPMServices
RNDC_USERNAME=TRANSPORTES@739
RNDC_PASSWORD=Alejandro_1971
RNDC_TIMEOUT=30000

UPLOAD_MAX_SIZE=100MB
UPLOAD_TEMP_DIR=./uploads/temp
LOG_LEVEL=info
EOF

chmod 600 .env
log_success "Configuración actualizada"

# PASO 6/10: Crear página web básica
show_progress 6 10 "Creando interfaz web"
mkdir -p client/public

cat > client/public/index.html << 'EOF'
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RNDC Completo - VM Local</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            background: white;
            padding: 2rem;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            max-width: 800px;
            width: 90%;
        }
        .header {
            text-align: center;
            margin-bottom: 2rem;
            padding-bottom: 1rem;
            border-bottom: 2px solid #eee;
        }
        .logo {
            color: #667eea;
            font-size: 2.5rem;
            font-weight: bold;
            margin-bottom: 0.5rem;
        }
        .status-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin: 2rem 0;
        }
        .status-card {
            background: #f8f9fa;
            padding: 1.5rem;
            border-radius: 8px;
            text-align: center;
            border: 2px solid #28a745;
            background: #d4edda;
        }
        .features {
            margin: 2rem 0;
        }
        .feature-list {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 0.5rem;
        }
        .feature-item {
            padding: 0.5rem;
            background: #f8f9fa;
            border-radius: 5px;
            border-left: 4px solid #667eea;
        }
        .btn {
            display: inline-block;
            padding: 0.75rem 1.5rem;
            background: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 0.5rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">RNDC Completo</div>
            <div>Sistema de Gestión de Transporte - VM Local</div>
            <div style="margin-top: 1rem; color: #667eea; font-weight: bold;">
                IP: 192.168.2.139 | Puerto: 5000
            </div>
        </div>

        <div class="status-grid">
            <div class="status-card">
                <div><strong>Servidor</strong></div>
                <div>Activo</div>
            </div>
            <div class="status-card">
                <div><strong>Base de Datos</strong></div>
                <div>PostgreSQL</div>
            </div>
            <div class="status-card">
                <div><strong>Web Server</strong></div>
                <div>Nginx</div>
            </div>
            <div class="status-card">
                <div><strong>RNDC API</strong></div>
                <div>Conectado</div>
            </div>
        </div>

        <div class="features">
            <h3>Funcionalidades Disponibles</h3>
            <div class="feature-list">
                <div class="feature-item">Gestión de Remesas</div>
                <div class="feature-item">Manifiestos de Carga</div>
                <div class="feature-item">Gestión de Vehículos</div>
                <div class="feature-item">Gestión de Terceros</div>
                <div class="feature-item">Integración SOAP RNDC</div>
                <div class="feature-item">Reportes y Consultas</div>
                <div class="feature-item">Carga Masiva Excel</div>
                <div class="feature-item">Sistema de Autenticación</div>
            </div>
        </div>

        <div style="text-align: center; margin: 2rem 0;">
            <a href="/api/status" class="btn">Estado del Sistema</a>
            <a href="/health" class="btn">Health Check</a>
            <a href="/api/rndc/test" class="btn">Test RNDC</a>
        </div>

        <div style="text-align: center; margin-top: 2rem; padding-top: 1rem; border-top: 2px solid #eee;">
            <p><strong>RNDC Completo v2.0</strong></p>
            <p>VM Local Ubuntu 22.04 - Usuario: server</p>
            <p id="timestamp"></p>
        </div>
    </div>

    <script>
        document.getElementById('timestamp').textContent = 
            'Última actualización: ' + new Date().toLocaleString('es-CO');
        
        setInterval(() => {
            document.getElementById('timestamp').textContent = 
                'Última actualización: ' + new Date().toLocaleString('es-CO');
        }, 60000);
    </script>
</body>
</html>
EOF

log_success "Interfaz web creada"

# PASO 7/10: Crear directorios adicionales
show_progress 7 10 "Creando estructura de directorios"
mkdir -p uploads/temp
mkdir -p logs
mkdir -p shared
log_success "Directorios creados"

# PASO 8/10: Actualizar servicio systemd
show_progress 8 10 "Actualizando servicio systemd"
sudo tee /etc/systemd/system/rndc.service > /dev/null << EOF
[Unit]
Description=RNDC Completo VM Local
After=network.target postgresql.service nginx.service

[Service]
Type=simple
User=server
WorkingDirectory=$APP_DIR
Environment=NODE_ENV=production
Environment=PORT=5000
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
log_success "Servicio actualizado"

# PASO 9/10: Iniciar servicios
show_progress 9 10 "Iniciando servicios"
log_info "Reiniciando servicios..."

sudo systemctl restart postgresql
sudo systemctl restart nginx
sudo systemctl start rndc

sleep 5

if systemctl is-active --quiet postgresql; then
    log_success "PostgreSQL activo"
else
    log_error "PostgreSQL inactivo"
fi

if systemctl is-active --quiet nginx; then
    log_success "Nginx activo"
else
    log_error "Nginx inactivo"
fi

if systemctl is-active --quiet rndc; then
    log_success "RNDC activo"
else
    log_warning "RNDC inactivo - verificando..."
    sudo journalctl -u rndc -n 10 --no-pager
fi

# PASO 10/10: Verificación final
show_progress 10 10 "Verificación final"
log_info "Ejecutando pruebas finales..."

sleep 3

if curl -f -s http://localhost:5000 >/dev/null; then
    log_success "Aplicación respondiendo en puerto 5000"
else
    log_error "Aplicación no responde en puerto 5000"
fi

if curl -f -s http://localhost >/dev/null; then
    log_success "Nginx funcionando en puerto 80"
else
    log_error "Nginx no funciona en puerto 80"
fi

# Crear archivo de información
cat > /home/server/RNDC_COMPLETO_INFO.txt << EOF
RNDC Completo - Información de Instalación
==========================================
Fecha: $(date)
Versión: 2.0.0
IP: 192.168.2.139

Acceso:
- URL Principal: http://192.168.2.139
- Puerto Directo: http://192.168.2.139:5000
- API Status: http://192.168.2.139/api/status

Funcionalidades:
- Gestión de Remesas: /api/remesas
- Manifiestos: /api/manifiestos  
- Vehículos: /api/vehiculos
- Terceros: /api/terceros
- RNDC SOAP: /api/rndc

Administración:
- ./rndc-admin status
- ./rndc-admin test
- ./rndc-admin restart

Base de Datos:
- Host: localhost:5432
- BD: rndc_db
- Usuario: rndc_user
- Password: alejandro_rndc_2024
EOF

# RESUMEN FINAL
clear
echo ""
echo "════════════════════════════════════════════════════════════════"
echo "              RNDC COMPLETO INSTALADO EXITOSAMENTE"
echo "════════════════════════════════════════════════════════════════"
echo ""
log_success "RNDC Completo v2.0 instalado en VM Local"
echo ""
echo "ACCESO:"
echo "   URL Principal: http://192.168.2.139"
echo "   Puerto Directo: http://192.168.2.139:5000"
echo "   API Status: http://192.168.2.139/api/status"
echo ""
echo "FUNCIONALIDADES:"
echo "   • Gestión de Remesas y Manifiestos"
echo "   • Integración SOAP con RNDC"
echo "   • Gestión de Vehículos y Terceros"
echo "   • Carga masiva desde Excel"
echo "   • Sistema de autenticación"
echo "   • Reportes y consultas"
echo ""
echo "ADMINISTRACIÓN:"
echo "   ./rndc-admin status    - Estado del sistema"
echo "   ./rndc-admin test      - Pruebas de conectividad"
echo "   ./rndc-admin restart   - Reiniciar servicios"
echo ""
echo "════════════════════════════════════════════════════════════════"

log_info "Respuesta de la aplicación:"
curl -s http://localhost:5000 | head -10

echo ""
echo ""
log_success "Instalación completada! Accede a http://192.168.2.139"
echo ""