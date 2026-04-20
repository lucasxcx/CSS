const LOCAL_API_FALLBACK = "http://localhost:4000";
const API_URL_STORAGE_KEY = "delivery:apiBaseUrl";

const trimTrailingSlashes = (value) => value.replace(/\/+$/, "");

const normalizeApiBaseUrl = (value) => {
  if (!value || typeof value !== "string") {
    return "";
  }

  const candidate = trimTrailingSlashes(value.trim());
  if (!candidate) {
    return "";
  }

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return "";
    }

    return trimTrailingSlashes(`${parsed.origin}${parsed.pathname}`);
  } catch {
    return "";
  }
};

const isLocalFrontendHost = () => {
  if (typeof window === "undefined") {
    return false;
  }

  return ["localhost", "127.0.0.1"].includes(window.location.hostname);
};

const readApiFromQueryString = () => {
  if (typeof window === "undefined") {
    return "";
  }

  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get("api") || params.get("apiUrl");
  return normalizeApiBaseUrl(fromQuery);
};

const readApiFromStorage = () => {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    return normalizeApiBaseUrl(localStorage.getItem(API_URL_STORAGE_KEY));
  } catch {
    return "";
  }
};

const persistApiToStorage = (value) => {
  if (typeof window === "undefined" || !value) {
    return;
  }

  try {
    localStorage.setItem(API_URL_STORAGE_KEY, value);
  } catch {
    // Ignore storage errors in private/restricted mode.
  }
};

const resolveApiBaseUrl = () => {
  const fromQuery = readApiFromQueryString();
  if (fromQuery) {
    persistApiToStorage(fromQuery);
    return fromQuery;
  }

  const fromStorage = readApiFromStorage();
  if (fromStorage) {
    return fromStorage;
  }

  const fromEnv = normalizeApiBaseUrl(import.meta.env.VITE_API_URL || "");
  if (fromEnv) {
    return fromEnv;
  }

  return isLocalFrontendHost() ? LOCAL_API_FALLBACK : "";
};

const API_BASE_URL = resolveApiBaseUrl();

const ensureApiBaseUrl = () => {
  if (API_BASE_URL) {
    return API_BASE_URL;
  }

  throw new Error(
    "API não configurada. Abra a URL do frontend com ?api=https://SEU-TUNNEL.trycloudflare.com ou gere o build com VITE_API_URL."
  );
};

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

  return `Falha de conexão ao enviar para ${API_BASE_URL || "API não configurada"}. Verifique túneis/backend, sinal de rede e tente novamente.`;
};

export const confirmDelivery = async (payload) => {
  const apiBaseUrl = ensureApiBaseUrl();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  let response;
  let lastError;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      response = await fetch(`${apiBaseUrl}/deliveries/confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      break;
    } catch (error) {
      lastError = error;
      if (attempt === 0) {
        await new Promise((resolve) => setTimeout(resolve, 800));
      }
    }
  }

  if (!response) {
    clearTimeout(timeoutId);
    throw new Error(buildNetworkErrorMessage(lastError));
  }

  clearTimeout(timeoutId);
  return parseResponse(response);
};

export const fetchDeliveries = async () => {
  const apiBaseUrl = ensureApiBaseUrl();
  const response = await fetch(`${apiBaseUrl}/deliveries`);
  return parseResponse(response);
};

export const getApiBaseUrl = () => API_BASE_URL;
