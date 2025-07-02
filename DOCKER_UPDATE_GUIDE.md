# Guia para Atualizar Docker com Traduções em Português

## 1. Preparar o Ambiente

Certifique-se de que o Docker e Docker Compose estão instalados e funcionando:

```bash
docker --version
docker-compose --version
```

## 2. Parar Containers Existentes (se houver)

```bash
# Navegue até o diretório docker/run
cd docker/run

# Pare os containers em execução
docker-compose down
```

## 3. Construir Nova Imagem com Traduções

### Opção A: Build Local Simples
```bash
# Construir imagem local com as traduções
docker build -t agent-zero-translated:latest --build-arg BRANCH=main --build-arg CACHE_DATE=$(date +%Y-%m-%d:%H:%M:%S) .
```

### Opção B: Build Local sem Cache (recomendado para garantir que todas as mudanças sejam incluídas)
```bash
# Construir imagem local sem cache
docker build -t agent-zero-translated:latest --build-arg BRANCH=main --no-cache .
```

## 4. Atualizar docker-compose.yml

Modifique o arquivo `docker/run/docker-compose.yml` para usar a nova imagem:

```yaml
services:
  agent-zero:
    container_name: agent-zero-translated
    image: agent-zero-translated:latest  # ou sua imagem personalizada
    volumes:
      - ./agent-zero:/a0
    ports:
      - "50080:80"
    environment:
      - LANG=pt_BR.UTF-8
      - LC_ALL=pt_BR.UTF-8
```

## 5. Iniciar o Container Atualizado

```bash
# Iniciar o container com as traduções
docker-compose up -d

# Verificar se está funcionando
docker-compose logs -f
```

## 6. Verificar a Tradução

1. Acesse `http://localhost:50080` no seu navegador
2. Verifique se a interface está em português
3. Teste as funcionalidades principais:
   - Chat
   - Configurações 
   - Agendador de Tarefas
   - Upload de arquivos
   - Navegador de arquivos

## 7. (Opcional) Publicar Imagem Personalizada

Se quiser compartilhar a versão traduzida:

```bash
# Tag da imagem
docker tag agent-zero-translated:latest seu-usuario/agent-zero-pt-br:latest

# Login no Docker Hub
docker login

# Push da imagem
docker push seu-usuario/agent-zero-pt-br:latest
```

## 8. Solução de Problemas

### Se a interface não estiver em português:
```bash
# Verificar logs do container
docker-compose logs agent-zero

# Entrar no container para debug
docker exec -it agent-zero-translated bash

# Verificar se os arquivos traduzidos estão presentes
ls -la /a0/webui/
```

### Limpar cache do Docker se necessário:
```bash
# Remover containers parados
docker container prune

# Remover imagens não utilizadas
docker image prune

# Rebuild completo
docker system prune -a
```

## 9. Comandos Úteis

```bash
# Ver containers em execução
docker ps

# Ver logs em tempo real
docker-compose logs -f

# Reiniciar apenas o serviço
docker-compose restart agent-zero

# Parar e remover tudo
docker-compose down --volumes --remove-orphans
```

## Notas Importantes

- As traduções estão nos arquivos HTML, JS e Python da interface
- Certifique-se de que o volume está mapeando corretamente os arquivos
- Teste todas as funcionalidades após a atualização
- Mantenha backup dos dados antes de atualizar
