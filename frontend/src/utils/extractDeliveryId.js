export const extractDeliveryId = (value) => {
  if (!value || typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  if (trimmed.includes("delivery_id=")) {
    try {
      const parsedUrl = new URL(trimmed, window.location.origin);
      return parsedUrl.searchParams.get("delivery_id");
    } catch {
      return trimmed.split("delivery_id=")[1]?.split("&")[0] ?? null;
    }
  }

  if (trimmed.startsWith("delivery_id:")) {
    return trimmed.replace("delivery_id:", "").trim();
  }

  return trimmed;
};
