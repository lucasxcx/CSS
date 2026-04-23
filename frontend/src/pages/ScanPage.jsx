import { Html5Qrcode } from "html5-qrcode";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import FeedbackBanner from "../components/FeedbackBanner";
import { extractDeliveryId } from "../utils/extractDeliveryId";

const SCANNER_ELEMENT_ID = "delivery-qr-reader";
const PRIMARY_GEO_OPTIONS = { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 };
const FALLBACK_GEO_OPTIONS = { enableHighAccuracy: false, timeout: 12000, maximumAge: 120000 };

function ScanPage() {
  const navigate = useNavigate();
  const routeLocation = useLocation();
  const scannerRef = useRef(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [manualCode, setManualCode] = useState("");
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [geoStatus, setGeoStatus] = useState("");

  const readCurrentPosition = useCallback(
    (options) =>
      new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, options);
      }),
    []
  );

  const getCurrentLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setGeoStatus("Geolocalização não suportada neste dispositivo.");
      return null;
    }

    setGeoStatus("Capturando geolocalização...");

    try {
      const position = await readCurrentPosition(PRIMARY_GEO_OPTIONS);
      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      };
    } catch (error) {
      if (error?.code === 1) {
        setGeoStatus("Permissão de localização negada.");
        return null;
      }

      if (error?.code === 3) {
        setGeoStatus("Sinal de GPS fraco. Tentando localização aproximada...");
      } else {
        setGeoStatus("Falha no GPS de alta precisão. Tentando localização aproximada...");
      }
    }

    try {
      const fallbackPosition = await readCurrentPosition(FALLBACK_GEO_OPTIONS);
      return {
        latitude: fallbackPosition.coords.latitude,
        longitude: fallbackPosition.coords.longitude,
        accuracy: fallbackPosition.coords.accuracy,
      };
    } catch {
      setGeoStatus("Não foi possível obter localização. Continuando sem coordenadas.");
      return null;
    }
  }, [readCurrentPosition]);

  const goToConfirmPage = useCallback(async (rawValue) => {
    const deliveryId = extractDeliveryId(rawValue);

    if (!deliveryId) {
      setErrorMessage("QR Code inválido. Não foi possível extrair o delivery_id.");
      return;
    }

    const capturedLocation = await getCurrentLocation();
    const locationPayload = capturedLocation
      ? {
          latitude: capturedLocation.latitude,
          longitude: capturedLocation.longitude,
          accuracy: capturedLocation.accuracy ?? null,
          geolocatedAt: new Date().toISOString(),
        }
      : null;

    if (locationPayload) {
      setGeoStatus("Geolocalização capturada no escaneamento.");
      sessionStorage.setItem(
        `scan_location:${deliveryId}`,
        JSON.stringify(locationPayload)
      );
    }

    navigate(`/confirm/${encodeURIComponent(deliveryId)}${routeLocation.search}`, {
      state: {
        scannedLocation: locationPayload,
      },
    });
  }, [getCurrentLocation, navigate, routeLocation.search]);

  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current;

    if (!scanner) {
      return;
    }

    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }
    } catch {
      // Ignora falhas ao interromper stream durante transições de câmera/rota.
    }

    try {
      await scanner.clear();
    } catch {
      // Ignora falhas de limpeza para manter fluxo de leitura responsivo.
    } finally {
      scannerRef.current = null;
      setIsScanning(false);
    }
  }, []);

  const getReadableError = useCallback((error) => {
    const errorName = error?.name || "";
    const errorText = `${error?.message || error || ""}`.toLowerCase();

    if (!window.isSecureContext) {
      return "A câmera só funciona em contexto seguro (HTTPS). Abra a URL segura da porta no Cursor.";
    }

    if (errorName === "NotAllowedError" || errorText.includes("permission denied")) {
      return "Permissão de câmera negada. Libere o acesso à câmera nas configurações do navegador.";
    }

    if (errorName === "NotFoundError" || errorText.includes("requested device not found")) {
      return "Nenhuma câmera disponível neste dispositivo.";
    }

    if (errorName === "NotReadableError" || errorText.includes("could not start video source")) {
      return "A câmera está ocupada por outro aplicativo/aba. Feche o app que está usando a câmera e tente novamente.";
    }

    return "Não foi possível iniciar a leitura por câmera. Verifique permissões e teste outra câmera.";
  }, []);

  const startScanner = useCallback(async () => {
    setErrorMessage("");
    setIsStartingCamera(true);

    try {
      const qrBoxSize = Math.max(220, Math.min(320, Math.floor(window.innerWidth * 0.72)));

      await stopScanner();
      const scanConfig = { fps: 14, qrbox: { width: qrBoxSize, height: qrBoxSize } };
      const onScanSuccess = async (decodedText) => {
        await stopScanner();
        await goToConfirmPage(decodedText);
      };
      const onScanError = () => {};

      let started = false;
      let lastError = null;
      const availableCameras = await Html5Qrcode.getCameras().catch(() => []);
      const sortedCameraIds = [...availableCameras]
        .sort((a, b) => {
          const aScore = /(back|rear|environment|traseira|trás)/i.test(a.label || "") ? 0 : 1;
          const bScore = /(back|rear|environment|traseira|trás)/i.test(b.label || "") ? 0 : 1;
          return aScore - bScore;
        })
        .map((camera) => camera.id);

      const startupAttempts = [
        { facingMode: { exact: "environment" } },
        { facingMode: { ideal: "environment" } },
        ...sortedCameraIds,
        { facingMode: { ideal: "user" } },
      ];

      for (const cameraConfig of startupAttempts) {
        try {
          await stopScanner();
          const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID, {
            verbose: false,
          });
          scannerRef.current = scanner;
          await scanner.start(cameraConfig, scanConfig, onScanSuccess, onScanError);
          started = true;
          break;
        } catch (error) {
          lastError = error;
        }
      }

      if (!started) {
        throw lastError ?? new Error("Não foi possível iniciar a câmera traseira.");
      }

      setIsScanning(true);
    } catch (error) {
      setErrorMessage(getReadableError(error));
    } finally {
      setIsStartingCamera(false);
    }
  }, [getReadableError, goToConfirmPage, stopScanner]);

  useEffect(() => {
    return () => {
      void stopScanner();
    };
  }, [stopScanner]);

  const handleManualSubmit = async (event) => {
    event.preventDefault();
    await goToConfirmPage(manualCode);
  };

  return (
    <section className="space-y-4 rounded-2xl bg-white p-4 shadow-sm sm:p-6">
      <h2 className="text-lg font-bold text-red-900">Escaneamento de QR Code</h2>
      <p className="text-sm text-slate-600">
        Aponte a câmera para o QR Code da entrega. Se preferir, digite o código manualmente.
      </p>
      <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
        No celular, escaneie um QR exibido em outro dispositivo (não funciona apontar para o QR na mesma tela).
      </p>

      <div className="grid grid-cols-1 gap-2">
        <button
          className="btn-primary"
          type="button"
          onClick={isScanning ? stopScanner : startScanner}
          disabled={isStartingCamera}
        >
          {isStartingCamera ? "Iniciando..." : isScanning ? "Parar leitura" : "Iniciar leitura"}
        </button>
      </div>

      <div id={SCANNER_ELEMENT_ID} className="overflow-hidden rounded-xl border border-slate-200" />

      <FeedbackBanner type="error" message={errorMessage} />
      <FeedbackBanner
        type="info"
        message={
          isStartingCamera
            ? "Iniciando câmera..."
            : isScanning
              ? "Leitor ativo. Aponte para o QR Code."
              : ""
        }
      />
      <FeedbackBanner type="info" message={geoStatus} />

      <form className="space-y-3 rounded-xl border border-slate-200 p-4" onSubmit={handleManualSubmit}>
        <label className="text-sm font-semibold text-slate-700" htmlFor="manual-code">
          Código manual
        </label>
        <input
          id="manual-code"
          className="form-input"
          placeholder="Ex.: delivery_id:ABC123"
          value={manualCode}
          onChange={(event) => setManualCode(event.target.value)}
        />
        <button className="btn-secondary w-full" type="submit">
          Continuar sem câmera
        </button>
      </form>
    </section>
  );
}

export default ScanPage;
