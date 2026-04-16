# Backend - Controle de Entregas

API Express + SQLite com endpoints para confirmação e listagem de entregas.

## Executar

```bash
npm install
npm run dev
```

## Endpoints

- `POST /deliveries/confirm` (também disponível em `/api/deliveries/confirm`)
- `GET /deliveries` (também disponível em `/api/deliveries`)
- `GET /health`

## Geolocalização

O endpoint de confirmação aceita geolocalização opcional capturada no momento do scan:

- `scan_latitude`
- `scan_longitude`
- `scan_accuracy`
- `scan_geolocated_at`
