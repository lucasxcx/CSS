import { Html5Qrcode } from "html5-qrcode";
import { useEffect, useRef, useState } from "react";
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

  const goToConfirmPage = (rawValue) => {
    const deliveryId = extractDeliveryId(rawValue);

    if (!deliveryId) {
      setErrorMessage("QR Code inválido. Não foi possível extrair o delivery_id.");
      return;
    }

    navigate(`/confirm/${encodeURIComponent(deliveryId)}`);
  };

  const stopScanner = async () => {
    if (!scannerRef.current?.isScanning) {
      return;
    }

    await scannerRef.current.stop();
    await scannerRef.current.clear();
  };

  const startScanner = async () => {
    setErrorMessage("");
    setIsStartingCamera(true);

    try {
      const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID, {
        verbose: false,
      });

      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: { ideal: "environment" } },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        async (decodedText) => {
          await stopScanner();
          goToConfirmPage(decodedText);
        },
        () => {}
      );
    } catch (_error) {
      setErrorMessage(
        "Não foi possível iniciar a leitura por câmera. Verifique a permissão do navegador."
      );
    } finally {
      setIsStartingCamera(false);
    }
  };

  useEffect(() => {
    startScanner();

    return () => {
      stopScanner().catch(() => {});
    };
  }, []);

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

      <div id={SCANNER_ELEMENT_ID} className="overflow-hidden rounded-xl border border-slate-200" />

      <FeedbackBanner type="error" message={errorMessage} />
      <FeedbackBanner
        type="info"
        message={isStartingCamera ? "Iniciando câmera..." : ""}
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
