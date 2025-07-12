#!/bin/bash

# EmailChain Protocol - Deploy Script para VPS
# VPS: 31.97.100.96

set -e  # Parar execução se houver erro

# Configurações
VPS_IP="31.97.100.96"
VPS_USER="root"  # Altere se usar outro usuário
PROJECT_NAME="emailchain-protocol"
REMOTE_DIR="/var/www/$PROJECT_NAME"
LOCAL_BUILD_DIR="dist"
NGINX_CONFIG_NAME="emailchain"

echo "🚀 Iniciando deploy do EmailChain Protocol para VPS $VPS_IP"

# Função para executar comandos no VPS
run_remote() {
    ssh $VPS_USER@$VPS_IP "$1"
}

# Função para copiar arquivos para o VPS
copy_to_vps() {
    scp -r "$1" $VPS_USER@$VPS_IP:"$2"
}

# 1. Build do projeto localmente
echo "📦 Fazendo build do projeto..."
npm run build

if [ ! -d "$LOCAL_BUILD_DIR" ]; then
    echo "❌ Erro: Diretório de build não encontrado!"
    exit 1
fi

# 2. Preparar ambiente no VPS
echo "🔧 Preparando ambiente no VPS..."

run_remote "
    # Atualizar sistema
    apt update && apt upgrade -y
    
    # Instalar Nginx se não estiver instalado
    if ! command -v nginx &> /dev/null; then
        apt install nginx -y
        systemctl enable nginx
    fi
    
    # Instalar Node.js e npm se não estiverem instalados
    if ! command -v node &> /dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
        apt install -y nodejs
    fi
    
    # Instalar PM2 globalmente se não estiver instalado
    if ! command -v pm2 &> /dev/null; then
        npm install -g pm2
    fi
    
    # Criar diretório do projeto
    mkdir -p $REMOTE_DIR
    
    # Criar diretório para logs
    mkdir -p /var/log/$PROJECT_NAME
"

# 3. Copiar arquivos de build para o VPS
echo "📤 Enviando arquivos para o VPS..."
copy_to_vps "$LOCAL_BUILD_DIR/*" "$REMOTE_DIR/"

# 4. Configurar Nginx
echo "⚙️ Configurando Nginx..."

# Criar arquivo de configuração do Nginx
cat > /tmp/nginx_config << EOF
server {
    listen 80;
    server_name $VPS_IP;
    
    root $REMOTE_DIR;
    index index.html;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Handle client-side routing
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # API proxy (se necessário)
    location /api/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # WebSocket support
    location /ws {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Copiar configuração do Nginx para o VPS
copy_to_vps "/tmp/nginx_config" "/tmp/nginx_$NGINX_CONFIG_NAME"

run_remote "
    # Mover configuração para o diretório correto
    mv /tmp/nginx_$NGINX_CONFIG_NAME /etc/nginx/sites-available/$NGINX_CONFIG_NAME
    
    # Criar link simbólico
    ln -sf /etc/nginx/sites-available/$NGINX_CONFIG_NAME /etc/nginx/sites-enabled/
    
    # Remover configuração padrão se existir
    rm -f /etc/nginx/sites-enabled/default
    
    # Testar configuração do Nginx
    nginx -t
    
    # Recarregar Nginx
    systemctl reload nginx
    systemctl restart nginx
"

# 5. Configurar SSL com Let's Encrypt (opcional)
echo "🔒 Deseja configurar SSL com Let's Encrypt? (y/n)"
read -r setup_ssl

if [ "$setup_ssl" = "y" ] || [ "$setup_ssl" = "Y" ]; then
    echo "📝 Digite o domínio para SSL (ex: emailchain.com):"
    read -r domain
    
    if [ -n "$domain" ]; then
        run_remote "
            # Instalar Certbot
            apt install certbot python3-certbot-nginx -y
            
            # Obter certificado SSL
            certbot --nginx -d $domain --non-interactive --agree-tos --email admin@$domain
            
            # Configurar renovação automática
            crontab -l | { cat; echo '0 12 * * * /usr/bin/certbot renew --quiet'; } | crontab -
        "
        echo "✅ SSL configurado para $domain"
    fi
fi

# 6. Configurar firewall
echo "🔥 Configurando firewall..."
run_remote "
    # Instalar UFW se não estiver instalado
    if ! command -v ufw &> /dev/null; then
        apt install ufw -y
    fi
    
    # Configurar regras básicas
    ufw --force reset
    ufw default deny incoming
    ufw default allow outgoing
    
    # Permitir SSH, HTTP e HTTPS
    ufw allow ssh
    ufw allow 80/tcp
    ufw allow 443/tcp
    
    # Ativar firewall
    ufw --force enable
"

# 7. Criar script de atualização
echo "📝 Criando script de atualização..."

cat > /tmp/update_script << 'EOF'
#!/bin/bash
# Script de atualização do EmailChain Protocol

PROJECT_DIR="/var/www/emailchain-protocol"
BACKUP_DIR="/var/backups/emailchain-$(date +%Y%m%d_%H%M%S)"

echo "🔄 Iniciando atualização..."

# Fazer backup
echo "💾 Fazendo backup..."
mkdir -p /var/backups
cp -r $PROJECT_DIR $BACKUP_DIR

echo "✅ Backup criado em: $BACKUP_DIR"
echo "🚀 Atualização concluída!"
EOF

copy_to_vps "/tmp/update_script" "/usr/local/bin/update-emailchain"

run_remote "
    chmod +x /usr/local/bin/update-emailchain
    
    # Criar script de monitoramento
    cat > /usr/local/bin/monitor-emailchain << 'MONITOR_EOF'
#!/bin/bash
# Script de monitoramento do EmailChain Protocol

echo '=== EmailChain Protocol Status ==='
echo 'Nginx Status:'
systemctl status nginx --no-pager -l

echo -e '\nDisk Usage:'
df -h /var/www/emailchain-protocol

echo -e '\nMemory Usage:'
free -h

echo -e '\nNetwork Connections:'
netstat -tulpn | grep :80
netstat -tulpn | grep :443

echo -e '\nRecent Nginx Logs:'
tail -n 10 /var/log/nginx/access.log
MONITOR_EOF
    
    chmod +x /usr/local/bin/monitor-emailchain
"

# 8. Verificar deploy
echo "🔍 Verificando deploy..."
run_remote "
    # Verificar se os arquivos foram copiados
    ls -la $REMOTE_DIR
    
    # Verificar status do Nginx
    systemctl status nginx --no-pager
    
    # Verificar se o site está respondendo
    curl -I http://localhost/ || echo 'Site não está respondendo localmente'
"

# 9. Informações finais
echo ""
echo "🎉 Deploy concluído com sucesso!"
echo ""
echo "📋 Informações do deploy:"
echo "   🌐 IP do VPS: $VPS_IP"
echo "   📁 Diretório: $REMOTE_DIR"
echo "   🔧 Nginx config: /etc/nginx/sites-available/$NGINX_CONFIG_NAME"
echo ""
echo "🔧 Comandos úteis no VPS:"
echo "   📊 Monitorar: monitor-emailchain"
echo "   🔄 Atualizar: update-emailchain"
echo "   📝 Logs Nginx: tail -f /var/log/nginx/access.log"
echo "   🔄 Reiniciar Nginx: systemctl restart nginx"
echo ""
echo "🌐 Acesse seu site em: http://$VPS_IP"
if [ -n "$domain" ]; then
    echo "🔒 Ou com SSL em: https://$domain"
fi
echo ""
echo "⚠️  Lembre-se de:"
echo "   1. Configurar suas variáveis de ambiente"
echo "   2. Configurar seu domínio (se aplicável)"
echo "   3. Monitorar os logs regularmente"
echo "   4. Fazer backups regulares"

# Limpar arquivos temporários
rm -f /tmp/nginx_config /tmp/update_script

echo ""
echo "✅ Deploy finalizado!"