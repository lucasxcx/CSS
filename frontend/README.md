# Frontend - Controle de Entregas com QR Code

Aplicação React responsável por:

- escanear QR Code com câmera
- coletar dados de confirmação (formulário + geolocalização do escaneamento)
- listar entregas em uma página administrativa
- gerar QR Codes de teste

## Execução

```bash
npm install
npm run dev
```

Por padrão, em ambiente local, a API é consumida em `http://localhost:4000`.

## Configurar API no celular (Cloudflare Tunnel)

Como a URL do backend muda com frequência no `trycloudflare.com`, você pode definir a API em runtime sem rebuild:

1. Abra o frontend com o parâmetro `api` apontando para o túnel do backend:

```text
https://SEU-FRONTEND.trycloudflare.com/?api=https://SEU-BACKEND.trycloudflare.com
```

2. O app salva essa URL no navegador (localStorage) e reutiliza nas próximas telas.
3. Quando o túnel do backend mudar, abra novamente com o novo `?api=...` para atualizar.

Alternativa: gerar build com variável de ambiente:

```bash
VITE_API_URL=https://SEU-BACKEND.trycloudflare.com npm run build
```
