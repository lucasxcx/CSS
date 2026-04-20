const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const parseResponse = async (response) => {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Erro na comunicação com o servidor.");
  }

  return data;
};

const buildNetworkErrorMessage = (error) => {
  if (error?.name === "AbortError") {
    return "Tempo de envio esgotado. Tente novamente.";
  }

  return "Falha de conexão ao enviar. Verifique os túneis/backend e tente novamente.";
};

export const confirmDelivery = async (payload) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  let response;

  try {
    response = await fetch(`${API_BASE_URL}/deliveries/confirm`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (error) {
    throw new Error(buildNetworkErrorMessage(error));
  } finally {
    clearTimeout(timeoutId);
  }

  return parseResponse(response);
};

export const fetchDeliveries = async () => {
  const response = await fetch(`${API_BASE_URL}/deliveries`);
  return parseResponse(response);
};

export const getApiBaseUrl = () => API_BASE_URL;
