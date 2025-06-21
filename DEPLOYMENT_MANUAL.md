# Manual de Despliegue - Aplicación RNDC
## Ubuntu 22.04 LTS - Guía Paso a Paso

### Prerrequisitos
- Instancia EC2 Ubuntu 22.04 con al menos 2GB RAM
- Acceso SSH a la instancia
- Usuario con privilegios sudo
- Puertos 22, 80, 443, 5000 abiertos en Security Groups

---

## 🚀 PASO 1: Preparación Inicial

### 1.1 Conectar a la instancia
```bash
ssh -i tu-clave.pem ubuntu@tu-ip-publica
```

### 1.2 Actualizar el sistema
```bash
sudo apt update && sudo apt upgrade -y
```

---

## 🔧 PASO 2: Instalación Automática

### 2.1 Descargar y ejecutar script de instalación
```bash
# Descargar los archivos de configuración
wget https://raw.githubusercontent.com/tu-repo/deploy-setup.sh
wget https://raw.githubusercontent.com/tu-repo/nginx-config.conf
wget https://raw.githubusercontent.com/tu-repo/systemd-service.service

# Dar permisos de ejecución
chmod +x deploy-setup.sh

# Ejecutar instalación automática
./deploy-setup.sh
```

### 2.2 Instalación Manual (Alternativa)
Si prefieres hacer la instalación paso a paso:

#### Instalar Node.js 20
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### Instalar PostgreSQL
```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### Instalar Nginx
```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

---

## 🗄️ PASO 3: Configuración de Base de Datos

### 3.1 Crear usuario y base de datos
```bash
sudo -u postgres psql
```

En la consola de PostgreSQL:
```sql
CREATE USER rndc_user WITH PASSWORD 'rndc_password_2024';
CREATE DATABASE rndc_db OWNER rndc_user;
GRANT ALL PRIVILEGES ON DATABASE rndc_db TO rndc_user;
ALTER USER rndc_user CREATEDB;
\q
```

### 3.2 Verificar conexión
```bash
psql -h localhost -U rndc_user -d rndc_db
```

---

## 📁 PASO 4: Desplegar la Aplicación

### 4.1 Clonar el repositorio
```bash
cd /var/www
sudo mkdir rndc
sudo chown -R $USER:$USER rndc
cd rndc

# Clonar tu repositorio (reemplaza con tu URL)
git clone https://github.com/tu-usuario/tu-repo.git .
```

### 4.2 Configurar variables de entorno
```bash
# Crear archivo .env
cat > .env << 'EOF'
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://rndc_user:rndc_password_2024@localhost:5432/rndc_db
SESSION_SECRET=tu-session-secret-super-seguro-genera-uno-aleatorio
PGHOST=localhost
PGPORT=5432
PGUSER=rndc_user
PGPASSWORD=rndc_password_2024
PGDATABASE=rndc_db
EOF
```

### 4.3 Instalar dependencias
```bash
npm install
```

### 4.4 Construir la aplicación
```bash
npm run build
```

### 4.5 Inicializar base de datos
```bash
npm run db:push
```

---

## 🌐 PASO 5: Configurar Nginx

### 5.1 Crear configuración de Nginx
```bash
sudo cp nginx-config.conf /etc/nginx/sites-available/rndc
```

### 5.2 Editar configuración
```bash
sudo nano /etc/nginx/sites-available/rndc
```

Cambiar `tu-dominio.com` por tu dominio real o IP pública.

### 5.3 Habilitar el sitio
```bash
sudo ln -s /etc/nginx/sites-available/rndc /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔄 PASO 6: Configurar Servicio Systemd

### 6.1 Crear servicio
```bash
sudo cp systemd-service.service /etc/systemd/system/rndc.service
```

### 6.2 Editar configuración del servicio
```bash
sudo nano /etc/systemd/system/rndc.service
```

Verificar que las rutas y variables sean correctas.

### 6.3 Habilitar y iniciar servicio
```bash
sudo systemctl daemon-reload
sudo systemctl enable rndc
sudo systemctl start rndc
```

### 6.4 Verificar estado
```bash
sudo systemctl status rndc
sudo journalctl -u rndc -f
```

---

## 🔒 PASO 7: Configurar Firewall

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
sudo ufw status
```

---

## 🔐 PASO 8: SSL/HTTPS (Opcional pero Recomendado)

### 8.1 Instalar Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 8.2 Obtener certificado SSL
```bash
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com
```

### 8.3 Renovación automática
```bash
sudo crontab -e
```

Agregar línea:
```
0 12 * * * /usr/bin/certbot renew --quiet
```

---

## ✅ PASO 9: Verificación Final

### 9.1 Verificar servicios
```bash
sudo systemctl status postgresql
sudo systemctl status nginx
sudo systemctl status rndc
```

### 9.2 Verificar logs
```bash
sudo journalctl -u rndc -n 50
sudo tail -f /var/log/nginx/rndc_access.log
sudo tail -f /var/log/nginx/rndc_error.log
```

### 9.3 Probar la aplicación
```bash
curl -I http://localhost:5000
curl -I http://tu-dominio.com
```

---

## 🔧 COMANDOS ÚTILES

### Reiniciar servicios
```bash
sudo systemctl restart rndc
sudo systemctl restart nginx
sudo systemctl restart postgresql
```

### Ver logs en tiempo real
```bash
sudo journalctl -u rndc -f
sudo tail -f /var/log/nginx/rndc_error.log
```

### Actualizar aplicación
```bash
cd /var/www/rndc
git pull origin main
npm install
npm run build
sudo systemctl restart rndc
```

### Backup de base de datos
```bash
pg_dump -h localhost -U rndc_user rndc_db > backup-$(date +%Y%m%d).sql
```

### Restaurar base de datos
```bash
psql -h localhost -U rndc_user rndc_db < backup-20241221.sql
```

---

## 🚨 Solución de Problemas

### Problema: Aplicación no inicia
```bash
sudo journalctl -u rndc -n 100
```

### Problema: Nginx no conecta
```bash
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
```

### Problema: Base de datos no conecta
```bash
sudo systemctl status postgresql
psql -h localhost -U rndc_user -d rndc_db
```

### Problema: Permisos
```bash
sudo chown -R ubuntu:ubuntu /var/www/rndc
sudo chmod -R 755 /var/www/rndc
```

---

## 📊 Monitoreo

### Instalar htop para monitoreo
```bash
sudo apt install htop
htop
```

### Ver uso de recursos
```bash
free -h
df -h
ps aux | grep node
```

---

## 🔄 Actualizaciones

Para actualizar la aplicación:

1. **Hacer backup**
   ```bash
   cd /var/www/rndc
   git stash
   pg_dump -h localhost -U rndc_user rndc_db > backup-pre-update.sql
   ```

2. **Actualizar código**
   ```bash
   git pull origin main
   npm install
   npm run build
   npm run db:push
   ```

3. **Reiniciar servicio**
   ```bash
   sudo systemctl restart rndc
   ```

4. **Verificar**
   ```bash
   sudo systemctl status rndc
   curl -I http://tu-dominio.com
   ```

---

## 📞 Contacto y Soporte

Si encuentras problemas durante el despliegue:

1. Revisa los logs con los comandos mostrados arriba
2. Verifica que todos los servicios estén ejecutándose
3. Confirma que las variables de entorno sean correctas
4. Asegúrate de que los puertos estén abiertos en AWS Security Groups

**¡La aplicación RNDC ya debería estar funcionando en tu dominio!**