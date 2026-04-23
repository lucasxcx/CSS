const deliveryModel = require("../models/deliveryModel");

const REQUIRED_FIELDS = ["delivery_id", "nome_recebedor", "documento"];
const parseCoordinate = (value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseAccuracy = (value) => {
  const parsed = parseCoordinate(value);
  if (parsed === null) {
    return null;
  }

  return parsed >= 0 ? parsed : null;
};

const validatePayload = (payload) => {
  const missingFields = REQUIRED_FIELDS.filter((field) => !payload[field]);

  if (missingFields.length > 0) {
    return {
      valid: false,
      message: `Campos obrigatórios ausentes: ${missingFields.join(", ")}`,
    };
  }

  const hasScanLocation =
    parseCoordinate(payload.scan_latitude) !== null &&
    parseCoordinate(payload.scan_longitude) !== null;

  if (!hasScanLocation) {
    return {
      valid: false,
      message:
        "Geolocalização obrigatória. Refaça o escaneamento e permita acesso à localização.",
    };
  }

  return { valid: true };
};

const normalizeDeliveryId = (value) => {
  if (typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  return trimmed.replace(/undefined$/i, "").trim();
};

const confirmDelivery = async (payload) => {
  const normalizedDeliveryId = normalizeDeliveryId(payload.delivery_id);
  const safePayload = {
    ...payload,
    delivery_id: normalizedDeliveryId,
  };

  const validation = validatePayload(safePayload);

  if (!validation.valid) {
    const error = new Error(validation.message);
    error.statusCode = 400;
    throw error;
  }

  const confirmedDelivery = await deliveryModel.confirmDelivery({
    delivery_id: normalizedDeliveryId,
    nome_recebedor: payload.nome_recebedor.trim(),
    documento: payload.documento.trim(),
    observacoes: payload.observacoes?.trim() ?? "",
    assinatura: null,
    foto: "",
    scan_latitude: parseCoordinate(payload.scan_latitude),
    scan_longitude: parseCoordinate(payload.scan_longitude),
    scan_accuracy: parseAccuracy(payload.scan_accuracy),
    scan_geolocated_at: payload.scan_geolocated_at ?? null,
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
