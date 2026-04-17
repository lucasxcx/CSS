const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const parseResponse = async (response) => {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Erro na comunicação com o servidor.");
  }

  return data;
};

export const confirmDelivery = async (payload) => {
  const response = await fetch(`${API_BASE_URL}/deliveries/confirm`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
};

export const fetchDeliveries = async () => {
  const response = await fetch(`${API_BASE_URL}/deliveries`);
  return parseResponse(response);
};

export const getApiBaseUrl = () => API_BASE_URL;
