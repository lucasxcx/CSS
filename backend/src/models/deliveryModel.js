const { all, get, run } = require("../config/database");

const createTable = async () => {
  await run(`
    CREATE TABLE IF NOT EXISTS deliveries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      delivery_id TEXT NOT NULL UNIQUE,
      nome_recebedor TEXT NOT NULL,
      documento TEXT NOT NULL,
      observacoes TEXT,
      assinatura TEXT,
      foto TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pendente',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

const confirmDelivery = async ({
  delivery_id,
  nome_recebedor,
  documento,
  observacoes,
  assinatura,
  foto,
}) => {
  await run(
    `
    INSERT INTO deliveries (
      delivery_id,
      nome_recebedor,
      documento,
      observacoes,
      assinatura,
      foto,
      status
    ) VALUES (?, ?, ?, ?, ?, ?, 'concluido')
    ON CONFLICT(delivery_id) DO UPDATE SET
      nome_recebedor = excluded.nome_recebedor,
      documento = excluded.documento,
      observacoes = excluded.observacoes,
      assinatura = excluded.assinatura,
      foto = excluded.foto,
      status = 'concluido',
      updated_at = CURRENT_TIMESTAMP
  `,
    [
      delivery_id,
      nome_recebedor,
      documento,
      observacoes,
      assinatura,
      foto,
    ]
  );

  return get(
    `
    SELECT
      id,
      delivery_id,
      nome_recebedor,
      documento,
      observacoes,
      assinatura,
      foto,
      status,
      created_at
    FROM deliveries
    WHERE delivery_id = ?
  `,
    [delivery_id]
  );
};

const getDeliveries = () =>
  all(
    `
    SELECT
      id,
      delivery_id,
      nome_recebedor,
      documento,
      observacoes,
      assinatura,
      foto,
      status,
      created_at
    FROM deliveries
    ORDER BY created_at DESC
  `
  );

module.exports = {
  createTable,
  confirmDelivery,
  getDeliveries,
};
