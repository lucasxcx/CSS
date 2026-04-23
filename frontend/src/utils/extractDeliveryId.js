export const normalizeDeliveryId = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  const normalized = String(value).trim().replace(/undefined$/i, "").trim();
  return normalized || null;
};

export const extractDeliveryId = (value) => {
  if (!value || typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  if (trimmed.includes("delivery_id=")) {
    try {
      const parsedUrl = new URL(trimmed, window.location.origin);
      return normalizeDeliveryId(parsedUrl.searchParams.get("delivery_id"));
    } catch {
      return normalizeDeliveryId(trimmed.split("delivery_id=")[1]?.split("&")[0] ?? null);
    }
  }

  if (trimmed.startsWith("delivery_id:")) {
    return normalizeDeliveryId(trimmed.replace("delivery_id:", "").trim());
  }

  return normalizeDeliveryId(trimmed);
};
