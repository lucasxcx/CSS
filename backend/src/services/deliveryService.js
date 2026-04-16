const path = require("path");
const deliveryModel = require("../models/deliveryModel");
const { saveBase64Image } = require("../utils/base64Image");

const REQUIRED_FIELDS = ["delivery_id", "nome_recebedor", "documento", "foto"];

const validatePayload = (payload) => {
  const missingFields = REQUIRED_FIELDS.filter((field) => !payload[field]);

  if (missingFields.length > 0) {
    return {
      valid: false,
      message: `Campos obrigatórios ausentes: ${missingFields.join(", ")}`,
    };
  }

  return { valid: true };
};

const confirmDelivery = async (payload) => {
  const validation = validatePayload(payload);

  if (!validation.valid) {
    const error = new Error(validation.message);
    error.statusCode = 400;
    throw error;
  }

  const imageResult = await saveBase64Image(
    payload.foto,
    path.resolve(__dirname, "../../uploads"),
    `delivery-${payload.delivery_id}`
  );

  const confirmedDelivery = await deliveryModel.confirmDelivery({
    delivery_id: payload.delivery_id.trim(),
    nome_recebedor: payload.nome_recebedor.trim(),
    documento: payload.documento.trim(),
    observacoes: payload.observacoes?.trim() ?? "",
    assinatura: payload.assinatura ?? null,
    foto: `/uploads/${imageResult.fileName}`,
  });

  return confirmedDelivery;
};

const listDeliveries = async () => {
  return deliveryModel.getDeliveries();
};

module.exports = {
  confirmDelivery,
  listDeliveries,
};
