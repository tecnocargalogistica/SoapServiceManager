# Instalación RNDC - Máquina Virtual Local

## Especificaciones del Sistema
- **Sistema Operativo:** Ubuntu 22.04 LTS
- **Tipo:** Máquina Virtual Local
- **IP:** 192.168.2.139
- **Usuario:** server
- **Contraseña:** alejandro

---

## 🚀 Instalación Automática

### Paso 1: Preparar el Script
```bash
# Conectarse a la VM como usuario 'server'
ssh server@192.168.2.139

# O desde la consola local de la VM
su - server

# Descargar el script de instalación
wget https://raw.githubusercontent.com/tu-repo/install-vm-clean.sh
# O copiar manualmente el archivo desde el host

# Dar permisos de ejecución
chmod +x install-vm-clean.sh
```

### Paso 2: Ejecutar Instalación
```bash
# Ejecutar el script (tomará 10-15 minutos)
./install-vm-clean.sh
```

El script realizará automáticamente:
- ✅ Actualización del sistema Ubuntu 22.04
- ✅ Instalación de Node.js 20
- ✅ Configuración de PostgreSQL
- ✅ Instalación y configuración de Nginx
- ✅ Descarga e instalación de la aplicación RNDC
- ✅ Configuración de variables de entorno
- ✅ Creación de servicio systemd
- ✅ Configuración de firewall UFW
- ✅ Pruebas de funcionamiento
- ✅ Creación de herramientas de administración

---

## 🌐 Acceso a la Aplicación

Una vez completada la instalación, puedes acceder desde:

### Desde tu computadora host:
- **URL Principal:** http://192.168.2.139
- **Puerto Directo:** http://192.168.2.139:5000

### Desde la propia VM:
- **Localhost:** http://localhost
- **IP Local:** http://127.0.0.1:5000

---

## 🛠️ Herramientas de Administración

El script instala automáticamente `rndc-admin`, una herramienta para gestionar la aplicación:

```bash
# Ver estado de todos los servicios
./rndc-admin status

# Ver logs en tiempo real
./rndc-admin logs

# Reiniciar servicios
./rndc-admin restart

# Probar conectividad
./rndc-admin test

# Ver información completa
./rndc-admin info

# Crear backup de base de datos
./rndc-admin backup

# Actualizar aplicación
./rndc-admin update
```

---

## 📊 Información del Sistema

### Servicios Instalados:
- **PostgreSQL:** Base de datos en puerto 5432
- **Nginx:** Proxy reverso en puerto 80
- **Node.js:** Aplicación RNDC en puerto 5000

### Directorios Importantes:
- **Aplicación:** `/home/server/rndc-app`
- **Logs Nginx:** `/var/log/nginx/rndc_*.log`
- **Configuración:** `/home/server/rndc-app/.env`

### Base de Datos:
- **Host:** localhost:5432
- **Base de datos:** rndc_db
- **Usuario:** rndc_user
- **Contraseña:** alejandro_rndc_2024

---

## 🔧 Comandos Útiles para VM

### Verificar servicios:
```bash
sudo systemctl status postgresql nginx rndc
```

### Ver logs específicos:
```bash
# Logs de la aplicación
sudo journalctl -u rndc -f

# Logs de Nginx
sudo tail -f /var/log/nginx/rndc_access.log

# Logs del sistema
sudo journalctl -f
```

### Gestión de la aplicación:
```bash
# Reiniciar solo la aplicación
sudo systemctl restart rndc

# Reiniciar Nginx
sudo systemctl restart nginx

# Ver estado detallado
sudo systemctl status rndc --no-pager -l
```

### Verificar red:
```bash
# Ver puertos abiertos
sudo netstat -tlnp | grep -E ':(80|5000|5432)'

# Verificar conectividad
curl -I http://localhost:5000
curl -I http://192.168.2.139
```

---

## 🚨 Solución de Problemas

### Problema: La aplicación no responde
```bash
# Ver logs detallados
sudo journalctl -u rndc -n 50

# Verificar puerto
sudo netstat -tlnp | grep 5000

# Reiniciar servicio
sudo systemctl restart rndc
```

### Problema: No hay conexión desde el host
```bash
# Verificar firewall
sudo ufw status

# Verificar Nginx
sudo nginx -t
sudo systemctl status nginx

# Verificar red VM
ip addr show
```

### Problema: Base de datos no conecta
```bash
# Verificar PostgreSQL
sudo systemctl status postgresql

# Probar conexión manual
PGPASSWORD=alejandro_rndc_2024 psql -h localhost -U rndc_user -d rndc_db
```

### Problema: Error de permisos
```bash
# Verificar propietario
ls -la /home/server/rndc-app

# Corregir permisos
sudo chown -R server:server /home/server/rndc-app
```

---

## 🔄 Actualización de la Aplicación

Para actualizar la aplicación a una nueva versión:

```bash
# Método automático
./rndc-admin update

# Método manual
cd /home/server/rndc-app
git pull origin main
npm install
npm run build
sudo systemctl restart rndc
```

---

## 💾 Backup y Restauración

### Crear backup:
```bash
# Backup automático
./rndc-admin backup

# Backup manual
PGPASSWORD=alejandro_rndc_2024 pg_dump -h localhost -U rndc_user rndc_db > backup-$(date +%Y%m%d).sql
```

### Restaurar backup:
```bash
# Restaurar desde archivo
PGPASSWORD=alejandro_rndc_2024 psql -h localhost -U rndc_user -d rndc_db < backup-20241221.sql
```

---

## 📱 Configuración de Red

### Para acceso desde otras máquinas en la red local:

1. **Verificar IP de la VM:**
   ```bash
   ip addr show
   ```

2. **Configurar firewall para red local:**
   ```bash
   sudo ufw allow from 192.168.2.0/24
   ```

3. **Acceder desde otras máquinas:**
   - http://192.168.2.139 (desde cualquier PC en la red 192.168.2.x)

---

## 📋 Lista de Verificación Post-Instalación

- [ ] ✅ La aplicación responde en http://192.168.2.139
- [ ] ✅ PostgreSQL está funcionando
- [ ] ✅ Nginx está configurado correctamente
- [ ] ✅ El servicio rndc está habilitado
- [ ] ✅ Los logs no muestran errores críticos
- [ ] ✅ El firewall permite el tráfico necesario
- [ ] ✅ Las herramientas de administración funcionan
- [ ] ✅ Es posible crear backups de la base de datos

---

## 📞 Información de Soporte

### Archivos de configuración importantes:
- `/etc/nginx/sites-available/rndc` - Configuración Nginx
- `/etc/systemd/system/rndc.service` - Servicio systemd
- `/home/server/rndc-app/.env` - Variables de entorno
- `/home/server/rndc-app/VM_INSTALLATION_INFO.txt` - Info de instalación

### Logs importantes:
- `sudo journalctl -u rndc` - Logs de la aplicación
- `/var/log/nginx/rndc_*.log` - Logs de Nginx
- `sudo journalctl -u postgresql` - Logs de PostgreSQL

**¡La aplicación RNDC está lista para usar en tu máquina virtual!**