#!/bin/bash

# Agent Zero - Script de Atualização Docker com Traduções PT-BR
# Este script automatiza o processo de build e deploy da versão traduzida

set -e  # Parar execução se houver erro

echo "🇧🇷 Agent Zero - Atualizando Docker com Traduções PT-BR"
echo "========================================================"

# Definir variáveis
IMAGE_NAME="agent-zero-pt-br"
CONTAINER_NAME="agent-zero-translated"
TAG="latest"
BRANCH="${1:-main}"

echo "📋 Configurações:"
echo "   - Imagem: $IMAGE_NAME:$TAG"
echo "   - Container: $CONTAINER_NAME"
echo "   - Branch: $BRANCH"
echo ""

# Verificar se Docker está funcionando
echo "🔍 Verificando Docker..."
if ! docker --version > /dev/null 2>&1; then
    echo "❌ Docker não encontrado. Instale o Docker primeiro."
    exit 1
fi

if ! docker-compose --version > /dev/null 2>&1; then
    echo "❌ Docker Compose não encontrado. Instale o Docker Compose primeiro."
    exit 1
fi

echo "✅ Docker está funcionando"

# Navegar para o diretório docker/run
cd "$(dirname "$0")/docker/run"

echo "📂 Navegando para: $(pwd)"

# Parar containers existentes
echo "🛑 Parando containers existentes..."
docker-compose down 2>/dev/null || true

# Remover imagem antiga se existir
echo "🗑️  Removendo imagem antiga..."
docker rmi $IMAGE_NAME:$TAG 2>/dev/null || true

# Construir nova imagem
echo "🔨 Construindo nova imagem com traduções..."
CACHE_DATE=$(date +%Y-%m-%d:%H:%M:%S)

if docker build -t $IMAGE_NAME:$TAG \
    --build-arg BRANCH=$BRANCH \
    --build-arg CACHE_DATE="$CACHE_DATE" \
    .; then
    echo "✅ Imagem construída com sucesso!"
else
    echo "❌ Falha ao construir a imagem"
    exit 1
fi

# Criar docker-compose.yml personalizado
echo "📝 Criando docker-compose.yml personalizado..."
cat > docker-compose-translated.yml << EOF
version: '3.8'
services:
  agent-zero:
    container_name: $CONTAINER_NAME
    image: $IMAGE_NAME:$TAG
    volumes:
      - ./agent-zero:/a0
    ports:
      - "50080:80"
    environment:
      - LANG=pt_BR.UTF-8
      - LC_ALL=pt_BR.UTF-8
    restart: unless-stopped
EOF

# Iniciar o container
echo "🚀 Iniciando container traduzido..."
if docker-compose -f docker-compose-translated.yml up -d; then
    echo "✅ Container iniciado com sucesso!"
else
    echo "❌ Falha ao iniciar container"
    exit 1
fi

# Aguardar um pouco para o container inicializar
echo "⏳ Aguardando inicialização..."
sleep 10

# Verificar se está funcionando
echo "🔍 Verificando status do container..."
if docker ps | grep -q $CONTAINER_NAME; then
    echo "✅ Container está executando!"
    echo ""
    echo "🎉 Sucesso! Agent Zero com tradução PT-BR está funcionando!"
    echo ""
    echo "📱 Acesse: http://localhost:50080"
    echo "📋 Container: $CONTAINER_NAME"
    echo "🐳 Imagem: $IMAGE_NAME:$TAG"
    echo ""
    echo "📊 Para ver os logs:"
    echo "   docker-compose -f docker-compose-translated.yml logs -f"
    echo ""
    echo "🛑 Para parar:"
    echo "   docker-compose -f docker-compose-translated.yml down"
else
    echo "❌ Container não está executando. Verificando logs..."
    docker-compose -f docker-compose-translated.yml logs
    exit 1
fi
