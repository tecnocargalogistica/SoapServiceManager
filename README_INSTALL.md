# Manual de Instalación - Sistema RNDC

Manual completo para desplegar la aplicación del Sistema RNDC en Ubuntu 22.04 con PostgreSQL.

## Requisitos Previos

- Servidor Ubuntu 22.04 LTS
- PostgreSQL instalado y funcionando
- Acceso root o sudo
- Conexión a internet

## Paso 1: Preparación del Sistema

### Actualizar el sistema
```bash
sudo apt update && sudo apt upgrade -y
```

### Instalar Node.js 20
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Verificar instalación
```bash
node --version  # Debe mostrar v20.x.x
npm --version   # Debe mostrar 10.x.x o superior
```

### Instalar herramientas adicionales
```bash
sudo apt install -y git curl unzip build-essential
```

## Paso 2: Configuración de PostgreSQL

### Crear base de datos y usuario
```bash
sudo -u postgres psql
```

Dentro de PostgreSQL:
```sql
CREATE USER rndc_user WITH PASSWORD 'password_seguro_aqui';
CREATE DATABASE rndc_db OWNER rndc_user;
GRANT ALL PRIVILEGES ON DATABASE rndc_db TO rndc_user;
ALTER USER rndc_user CREATEDB;
\q
```

### Verificar conexión
```bash
psql -h localhost -U rndc_user -d rndc_db -c "SELECT version();"
```

## Paso 3: Configuración de la Aplicación

### Crear directorio de trabajo
```bash
sudo mkdir -p /var/www/rndc-app
sudo chown $USER:$USER /var/www/rndc-app
cd /var/www/rndc-app
```

### Obtener código fuente
```bash
# Opción A: Desde repositorio Git
git clone [URL_DEL_REPOSITORIO] .

# Opción B: Subir archivos manualmente
# scp -r ./aplicacion-local/* usuario@servidor:/var/www/rndc-app/
```

### Configurar variables de entorno
```bash
nano .env
```

Contenido del archivo `.env`:
```env
NODE_ENV=production
DATABASE_URL=postgresql://rndc_user:password_seguro_aqui@localhost:5432/rndc_db
PGHOST=localhost
PGPORT=5432
PGUSER=rndc_user
PGPASSWORD=password_seguro_aqui
PGDATABASE=rndc_db
PORT=3000
```

### Instalar dependencias
```bash
npm install
```

### Inicializar base de datos
```bash
npm run db:push
```

## Paso 4: Configurar PM2 (Gestor de Procesos)

### Instalar PM2
```bash
sudo npm install -g pm2
```

### Crear configuración PM2
```bash
nano ecosystem.config.js
```

Contenido:
```javascript
module.exports = {
  apps: [{
    name: 'rndc-app',
    script: 'npm',
    args: 'run dev',
    cwd: '/var/www/rndc-app',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/pm2/rndc-error.log',
    out_file: '/var/log/pm2/rndc-out.log',
    log_file: '/var/log/pm2/rndc-combined.log',
    time: true
  }]
};
```

## Paso 5: Configurar Nginx (Proxy Reverso)

### Instalar Nginx
```bash
sudo apt install nginx -y
```

### Crear configuración del sitio
```bash
sudo nano /etc/nginx/sites-available/rndc-app
```

Contenido:
```nginx
server {
    listen 8082;
    server_name _;

    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Manejar archivos estáticos
    location /assets/ {
        proxy_pass http://localhost:3000/assets/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Activar la configuración
```bash
sudo ln -s /etc/nginx/sites-available/rndc-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## Paso 6: Configurar Firewall

```bash
sudo ufw allow 22      # SSH
sudo ufw allow 8082    # Aplicación RNDC
sudo ufw enable
sudo ufw status
```

## Paso 7: Iniciar la Aplicación

### Crear directorio de logs
```bash
sudo mkdir -p /var/log/pm2
sudo chown $USER:$USER /var/log/pm2
```

### Iniciar con PM2
```bash
cd /var/www/rndc-app
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Seguir el comando que aparece (similar a):
```bash
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME
```

## Paso 8: Verificación del Despliegue

### Verificar servicios
```bash
# Estado de la aplicación
pm2 status

# Estado de Nginx
sudo systemctl status nginx

# Estado de PostgreSQL
sudo systemctl status postgresql
```

### Verificar conectividad
```bash
# Verificar aplicación local
curl http://localhost:3000

# Verificar a través de Nginx
curl http://localhost:8082

# Verificar desde externa
curl http://IP_DEL_SERVIDOR:8082
```

### Ver logs
```bash
# Logs de la aplicación
pm2 logs rndc-app

# Logs de Nginx
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

## Comandos de Gestión

### Aplicación
```bash
# Reiniciar aplicación
pm2 restart rndc-app

# Detener aplicación
pm2 stop rndc-app

# Ver logs en tiempo real
pm2 logs rndc-app --lines 100

# Monitoreo en tiempo real
pm2 monit
```

### Actualización de código
```bash
cd /var/www/rndc-app
git pull                    # Si usas Git
npm install                 # Instalar nuevas dependencias
npm run db:push            # Aplicar cambios de BD si hay
pm2 restart rndc-app       # Reiniciar aplicación
```

### Nginx
```bash
# Reiniciar Nginx
sudo systemctl restart nginx

# Recargar configuración
sudo systemctl reload nginx

# Verificar configuración
sudo nginx -t
```

## Acceso a la Aplicación

Una vez completado el despliegue, la aplicación estará disponible en:
- **http://IP_DEL_SERVIDOR:8082**

## Funcionalidades Principales

1. **Gestión de Manifiestos**: Creación y seguimiento de manifiestos de carga
2. **Integración RNDC**: Comunicación directa con servicios SOAP del Ministerio
3. **Gestión de Vehículos**: Registro completo de flotilla vehicular
4. **Generación de PDFs**: Manifiestos con plantillas personalizables
5. **Procesamiento de Excel**: Carga masiva de remesas
6. **Cumplimientos**: Registro de cumplimientos de manifiestos

## Resolución de Problemas Comunes

### La aplicación no inicia
```bash
# Verificar logs
pm2 logs rndc-app

# Verificar variables de entorno
cat /var/www/rndc-app/.env

# Verificar conexión a base de datos
psql -h localhost -U rndc_user -d rndc_db -c "SELECT 1;"
```

### Error de conexión a base de datos
```bash
# Verificar que PostgreSQL esté corriendo
sudo systemctl status postgresql

# Verificar permisos de usuario
sudo -u postgres psql -c "\du"
```

### Problemas con Nginx
```bash
# Verificar configuración
sudo nginx -t

# Ver logs de error
sudo tail -f /var/log/nginx/error.log

# Verificar que el puerto esté libre
sudo netstat -tlnp | grep :8082
```

### Puerto 8082 ocupado
```bash
# Verificar qué usa el puerto
sudo lsof -i :8082

# Cambiar a otro puerto en la configuración de Nginx
sudo nano /etc/nginx/sites-available/rndc-app
# Cambiar "listen 8082;" por "listen PUERTO_LIBRE;"
sudo systemctl restart nginx
```

## Configuración SSL (Opcional)

### Con Let's Encrypt
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d tu-dominio.com
```

### Configuración manual
```bash
# Editar configuración de Nginx para incluir certificados SSL
sudo nano /etc/nginx/sites-available/rndc-app
```

## Respaldos

### Base de datos
```bash
# Crear respaldo
pg_dump -h localhost -U rndc_user rndc_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Restaurar respaldo
psql -h localhost -U rndc_user rndc_db < backup_archivo.sql
```

### Archivos de aplicación
```bash
# Respaldar configuración y logs
tar -czf rndc_backup_$(date +%Y%m%d_%H%M%S).tar.gz /var/www/rndc-app /var/log/pm2
```

## Soporte

Para problemas específicos del sistema RNDC, verificar:
1. Conectividad con servicios SOAP del Ministerio
2. Configuración de credenciales RNDC
3. Validación de datos según normativas RNDC
4. Logs de transacciones en `/var/log/pm2/rndc-combined.log`

---

**Versión del manual**: 1.0  
**Fecha**: $(date +%Y-%m-%d)  
**Sistema**: Ubuntu 22.04 LTS + PostgreSQL + Node.js 20