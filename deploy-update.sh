#!/bin/bash

# EmailChain Protocol - Script de Atualização Rápida
# Para atualizações subsequentes (mais rápido)

set -e

# Configurações
VPS_IP="31.97.100.96"
VPS_USER="root"
PROJECT_NAME="emailchain-protocol"
REMOTE_DIR="/var/www/$PROJECT_NAME"
LOCAL_BUILD_DIR="dist"

echo "🔄 Atualizando EmailChain Protocol no VPS $VPS_IP"

# Função para executar comandos no VPS
run_remote() {
    ssh $VPS_USER@$VPS_IP "$1"
}

# Função para copiar arquivos para o VPS
copy_to_vps() {
    scp -r "$1" $VPS_USER@$VPS_IP:"$2"
}

# 1. Build do projeto
echo "📦 Fazendo build do projeto..."
npm run build

if [ ! -d "$LOCAL_BUILD_DIR" ]; then
    echo "❌ Erro: Diretório de build não encontrado!"
    exit 1
fi

# 2. Fazer backup da versão atual
echo "💾 Fazendo backup da versão atual..."
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
run_remote "
    mkdir -p /var/backups
    cp -r $REMOTE_DIR /var/backups/${PROJECT_NAME}_backup_$TIMESTAMP
    echo 'Backup criado: /var/backups/${PROJECT_NAME}_backup_$TIMESTAMP'
"

# 3. Atualizar arquivos
echo "📤 Enviando novos arquivos..."
run_remote "rm -rf $REMOTE_DIR/*"
copy_to_vps "$LOCAL_BUILD_DIR/*" "$REMOTE_DIR/"

# 4. Verificar e recarregar Nginx
echo "🔄 Recarregando Nginx..."
run_remote "
    nginx -t && systemctl reload nginx
    echo 'Nginx recarregado com sucesso!'
"

# 5. Verificar se está funcionando
echo "🔍 Verificando deploy..."
run_remote "
    curl -I http://localhost/ | head -n 1
"

echo ""
echo "✅ Atualização concluída!"
echo "🌐 Acesse: http://$VPS_IP"
echo "📊 Monitorar: ssh $VPS_USER@$VPS_IP 'monitor-emailchain'"