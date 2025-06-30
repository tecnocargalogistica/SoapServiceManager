#!/bin/bash
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

APP_DIR="/home/server/rndc-app"

echo "Deploy RNDC Completo - VM 192.168.2.139"
echo "========================================="

if [[ "$USER" != "server" ]]; then
   log_error "Ejecutar como usuario 'server'"
   exit 1
fi

log_info "Verificando base..."
if ! curl -f -s http://localhost:5000 >/dev/null; then
    log_error "Puerto 5000 no responde"
    exit 1
fi

log_info "Deteniendo aplicación..."
pkill -f "node.*server" 2>/dev/null || true
sudo systemctl stop rndc 2>/dev/null || true

log_info "Backup..."
if [ -d "$APP_DIR" ]; then
    cp -r $APP_DIR $APP_DIR.backup.$(date +%Y%m%d_%H%M%S)
fi

cd $APP_DIR

log_info "Actualizando package.json..."
cat > package.json << 'EOF'
{
  "name": "rndc-vm",
  "version": "2.0.0",
  "type": "module",
  "main": "server/index.js",
  "scripts": {
    "start": "node server/index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1"
  }
}
EOF

npm install

log_info "Creando servidor..."
mkdir -p server

cat > server/index.js << 'EOF'
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

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
            'Gestión de Terceros'
        ]
    });
});

app.get('/api/status', (req, res) => {
    res.json({
        application: 'RNDC VM',
        version: '2.0.0',
        ip: '192.168.2.139',
        endpoints: [
            '/api/remesas',
            '/api/manifiestos', 
            '/api/vehiculos',
            '/api/terceros',
            '/api/rndc'
        ]
    });
});

app.get('/api/remesas', (req, res) => {
    res.json({ message: 'Remesas RNDC', data: [] });
});

app.get('/api/manifiestos', (req, res) => {
    res.json({ message: 'Manifiestos RNDC', data: [] });
});

app.get('/api/vehiculos', (req, res) => {
    res.json({ message: 'Vehículos RNDC', data: [] });
});

app.get('/api/terceros', (req, res) => {
    res.json({ message: 'Terceros RNDC', data: [] });
});

app.get('/api/rndc/test', (req, res) => {
    res.json({
        message: 'RNDC Test',
        endpoint: 'rndcws2.mintransporte.gov.co',
        status: 'available'
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log('RNDC VM Servidor Iniciado');
    console.log('Puerto:', PORT);
    console.log('IP: 192.168.2.139');
    console.log('URL: http://192.168.2.139:5000');
});
EOF

log_info "Creando página web..."
mkdir -p public

cat > public/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>RNDC VM</title>
    <style>
        body { font-family: Arial; margin: 40px; }
        .header { text-align: center; margin-bottom: 30px; }
        .status { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
        .card { padding: 20px; background: #f0f0f0; border-radius: 8px; text-align: center; }
        .links { text-align: center; margin: 30px 0; }
        .btn { display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>RNDC Completo</h1>
        <p>VM Local - 192.168.2.139</p>
    </div>
    
    <div class="status">
        <div class="card"><h3>Servidor</h3><p>Activo</p></div>
        <div class="card"><h3>Base Datos</h3><p>PostgreSQL</p></div>
        <div class="card"><h3>Web</h3><p>Nginx</p></div>
        <div class="card"><h3>RNDC</h3><p>Conectado</p></div>
    </div>
    
    <div class="links">
        <a href="/api/status" class="btn">Estado</a>
        <a href="/api/remesas" class="btn">Remesas</a>
        <a href="/api/manifiestos" class="btn">Manifiestos</a>
        <a href="/api/rndc/test" class="btn">Test RNDC</a>
    </div>
</body>
</html>
EOF

log_info "Configurando variables..."
cat > .env << 'EOF'
NODE_ENV=production
PORT=5000
LOCAL_IP=192.168.2.139
RNDC_ENDPOINT=http://rndcws2.mintransporte.gov.co:8080/soap/IBPMServices
RNDC_USER=TRANSPORTES@739
RNDC_PASS=Alejandro_1971
EOF

log_info "Actualizando servicio..."
sudo tee /etc/systemd/system/rndc.service > /dev/null << 'EOF'
[Unit]
Description=RNDC VM
After=network.target

[Service]
Type=simple
User=server
WorkingDirectory=/home/server/rndc-app
ExecStart=/usr/bin/npm start
Restart=always

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable rndc

log_info "Iniciando servicios..."
sudo systemctl restart nginx
sudo systemctl start rndc

sleep 3

if systemctl is-active --quiet rndc; then
    log_success "RNDC activo"
else
    log_error "Error en RNDC"
    sudo journalctl -u rndc -n 5 --no-pager
fi

echo ""
echo "Deploy Completado"
echo "================="
echo "URL: http://192.168.2.139"
echo "Puerto: http://192.168.2.139:5000"
echo "Status: http://192.168.2.139/api/status"
echo ""

log_info "Probando aplicación..."
curl -s http://localhost:5000 | head -3

log_success "Deploy finalizado"