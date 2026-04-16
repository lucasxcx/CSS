# Sistema de Controle de Entregas com QR Code

Aplicação full stack para simular confirmação de entregas em campo, com foco em uso mobile.

## Stack

- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** Node.js + Express
- **Banco de dados:** SQLite

## Estrutura

```text
backend/
  src/
    config/        # conexão e helpers do SQLite
    controllers/   # camada HTTP
    models/        # consultas SQL
    routes/        # rotas da API
    services/      # regras de negócio
    utils/         # helpers (ex.: salvar base64 em arquivo)
  data/            # banco SQLite (runtime)
  uploads/         # fotos capturadas (runtime)

frontend/
  src/
    components/    # componentes reutilizáveis
    pages/         # páginas da aplicação
    services/      # cliente da API
    utils/         # funções auxiliares
```

## Funcionalidades implementadas

- Tela inicial com botão **Escanear QR Code**
- Leitura de QR Code pela câmera (biblioteca `html5-qrcode`)
- Extração de `delivery_id` do QR
- Tela de confirmação da entrega com:
  - nome do recebedor
  - documento
  - observações
  - assinatura (canvas, opcional)
  - foto da entrega (câmera)
- Confirmação da entrega via `POST /deliveries/confirm`
- Persistência no SQLite e status como `concluido`
- Captura de geolocalização no momento do escaneamento (latitude/longitude)
- Painel administrativo para listagem (`GET /deliveries`)
- Gerador de QR de exemplo para testes
- Validações de campos obrigatórios
- Feedback visual de loading/sucesso/erro
- Interface responsiva para celular

## Endpoints

- `POST /deliveries/confirm`
- `GET /deliveries`
- `GET /health`

Campos adicionais de localização:
- `scan_latitude`
- `scan_longitude`
- `scan_accuracy`
- `scan_geolocated_at`

## Como rodar

### 1) Backend

```bash
cd backend
npm install
npm run dev
```

Servidor padrão em: `http://localhost:4000`

### 2) Frontend

Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

Aplicação padrão em: `http://localhost:5173`

## Configuração opcional de ambiente

- Frontend: copie `frontend/.env.example` para `frontend/.env` e ajuste `VITE_API_URL`
- Backend: copie `backend/.env.example` para `backend/.env` e ajuste `PORT`

## Fluxo recomendado de teste

1. Acesse a página **QR de teste**
2. Gere um `delivery_id` (ex.: `PED-1001`)
3. Vá em **Escanear**
4. Escaneie o QR
5. Preencha formulário + foto e confirme
6. Abra o painel **Administrativo** para visualizar o registro salvo
