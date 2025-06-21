#!/bin/bash
# Script de instalación para aplicación RNDC en Ubuntu 22.04
# Ejecutar como usuario con privilegios sudo

set -e

echo "🚀 Iniciando instalación de aplicación RNDC..."

# Actualizar sistema
echo "📦 Actualizando sistema..."
sudo apt update && sudo apt upgrade -y

# Instalar dependencias del sistema
echo "🔧 Instalando dependencias del sistema..."
sudo apt install -y curl wget git nginx postgresql postgresql-contrib build-essential

# Instalar Node.js 20
echo "📦 Instalando Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar instalaciones
echo "✅ Verificando instalaciones..."
node --version
npm --version
psql --version

# Configurar PostgreSQL
echo "🗄️ Configurando PostgreSQL..."
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Crear usuario y base de datos
echo "📊 Configurando base de datos..."
sudo -u postgres psql -c "CREATE USER rndc_user WITH PASSWORD 'rndc_password_2024';"
sudo -u postgres psql -c "CREATE DATABASE rndc_db OWNER rndc_user;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE rndc_db TO rndc_user;"
sudo -u postgres psql -c "ALTER USER rndc_user CREATEDB;"

# Configurar Nginx
echo "🌐 Configurando Nginx..."
sudo systemctl start nginx
sudo systemctl enable nginx

# Crear directorio para la aplicación
echo "📁 Preparando directorio de aplicación..."
sudo mkdir -p /var/www/rndc
sudo chown -R $USER:$USER /var/www/rndc

# Configurar firewall
echo "🔒 Configurando firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 5000/tcp
sudo ufw --force enable

echo "✅ Instalación base completada!"
echo "📝 Próximos pasos:"
echo "1. Clonar el repositorio en /var/www/rndc"
echo "2. Configurar variables de entorno"
echo "3. Instalar dependencias npm"
echo "4. Configurar Nginx como proxy"
echo "5. Configurar SSL (opcional)"
