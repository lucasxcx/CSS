import { Html5Qrcode } from "html5-qrcode";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import FeedbackBanner from "../components/FeedbackBanner";
import { extractDeliveryId } from "../utils/extractDeliveryId";

const SCANNER_ELEMENT_ID = "delivery-qr-reader";

function ScanPage() {
  const navigate = useNavigate();
  const scannerRef = useRef(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [manualCode, setManualCode] = useState("");
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [isLoadingCameras, setIsLoadingCameras] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState("");

  const goToConfirmPage = useCallback((rawValue) => {
    const deliveryId = extractDeliveryId(rawValue);

    if (!deliveryId) {
      setErrorMessage("QR Code inválido. Não foi possível extrair o delivery_id.");
      return;
    }

    navigate(`/confirm/${encodeURIComponent(deliveryId)}`);
  }, [navigate]);

  const stopScanner = useCallback(async () => {
    if (!scannerRef.current) {
      return;
    }

    if (scannerRef.current.isScanning) {
      await scannerRef.current.stop();
    }

    await scannerRef.current.clear().catch(() => {});
    scannerRef.current = null;
    setIsScanning(false);
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

  const loadCameras = useCallback(async () => {
    setErrorMessage("");
    setIsLoadingCameras(true);

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Navegador sem suporte a câmera.");
      }

      const availableCameras = await Html5Qrcode.getCameras();
      setCameras(availableCameras);

      if (availableCameras.length === 0) {
        setErrorMessage("Nenhuma câmera encontrada.");
        return;
      }

      setSelectedCameraId((currentId) => currentId || availableCameras[0].id);
    } catch (error) {
      setErrorMessage(getReadableError(error));
    } finally {
      setIsLoadingCameras(false);
    }
  }, [getReadableError]);

  const startScanner = useCallback(async () => {
    setErrorMessage("");
    setIsStartingCamera(true);

    try {
      const chosenCameraId = selectedCameraId || cameras[0]?.id;

      if (!chosenCameraId) {
        throw new Error("Selecione uma câmera para continuar.");
      }

      await stopScanner();

      const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID, {
        verbose: false,
      });

      scannerRef.current = scanner;

      await scanner.start(
        chosenCameraId,
        { fps: 10, qrbox: { width: 220, height: 220 } },
        async (decodedText) => {
          await stopScanner();
          goToConfirmPage(decodedText);
        },
        () => {}
      );

      setIsScanning(true);
    } catch (error) {
      setErrorMessage(getReadableError(error));
    } finally {
      setIsStartingCamera(false);
    }
  }, [cameras, getReadableError, goToConfirmPage, selectedCameraId, stopScanner]);

  useEffect(() => {
    loadCameras();

    return () => {
      stopScanner().catch(() => {});
    };
  }, [loadCameras, stopScanner]);

  const handleManualSubmit = (event) => {
    event.preventDefault();
    goToConfirmPage(manualCode);
  };

  return (
    <section className="space-y-4 rounded-2xl bg-white p-4 shadow-sm sm:p-6">
      <h2 className="text-lg font-bold text-slate-900">Escaneamento de QR Code</h2>
      <p className="text-sm text-slate-600">
        Aponte a câmera para o QR Code da entrega. Se preferir, digite o código manualmente.
      </p>
      <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
        No celular, escaneie um QR exibido em outro dispositivo (não funciona apontar para o QR na mesma tela).
      </p>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button className="btn-secondary" type="button" onClick={loadCameras} disabled={isLoadingCameras}>
          {isLoadingCameras ? "Buscando câmeras..." : "Atualizar câmeras"}
        </button>
        <button
          className="btn-primary"
          type="button"
          onClick={isScanning ? stopScanner : startScanner}
          disabled={isStartingCamera || cameras.length === 0}
        >
          {isStartingCamera ? "Iniciando..." : isScanning ? "Parar leitura" : "Iniciar leitura"}
        </button>
      </div>

      {cameras.length > 0 && (
        <div className="space-y-1">
          <label className="text-sm font-semibold text-slate-700" htmlFor="camera-select">
            Câmera
          </label>
          <select
            id="camera-select"
            className="form-input"
            value={selectedCameraId}
            onChange={(event) => setSelectedCameraId(event.target.value)}
          >
            {cameras.map((camera, index) => (
              <option key={camera.id} value={camera.id}>
                {camera.label || `Câmera ${index + 1}`}
              </option>
            ))}
          </select>
        </div>
      )}

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
