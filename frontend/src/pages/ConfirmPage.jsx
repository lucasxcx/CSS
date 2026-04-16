import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import FeedbackBanner from "../components/FeedbackBanner";
import PhotoCapture from "../components/PhotoCapture";
import SignaturePad from "../components/SignaturePad";
import { confirmDelivery } from "../services/api";

function ConfirmPage() {
  const { deliveryId } = useParams();
  const resolvedDeliveryId = useMemo(() => decodeURIComponent(deliveryId || ""), [deliveryId]);
  const scannedLocation = useMemo(() => {
    const storedValue = sessionStorage.getItem(`scan_location:${resolvedDeliveryId}`);

    if (!storedValue) {
      return null;
    }

    try {
      return JSON.parse(storedValue);
    } catch {
      return null;
    }
  }, [resolvedDeliveryId]);
  const [formValues, setFormValues] = useState({
    nomeRecebedor: "",
    documento: "",
    observacoes: "",
  });
  const [signature, setSignature] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: "info", message: "" });

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormValues((currentValues) => ({
      ...currentValues,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFeedback({ type: "info", message: "" });

    if (!formValues.nomeRecebedor || !formValues.documento || !photo) {
      setFeedback({
        type: "error",
        message: "Preencha nome, documento e foto da entrega.",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await confirmDelivery({
        delivery_id: resolvedDeliveryId,
        nome_recebedor: formValues.nomeRecebedor,
        documento: formValues.documento,
        observacoes: formValues.observacoes,
        assinatura: signature,
        foto: photo,
        scan_latitude: scannedLocation?.latitude ?? null,
        scan_longitude: scannedLocation?.longitude ?? null,
        scan_accuracy: scannedLocation?.accuracy ?? null,
        scan_geolocated_at: scannedLocation?.geolocatedAt ?? null,
      });

      setFeedback({
        type: "success",
        message: "Entrega confirmada com sucesso.",
      });
      setFormValues({ nomeRecebedor: "", documento: "", observacoes: "" });
      setSignature(null);
      setPhoto(null);
    } catch (error) {
      setFeedback({
        type: "error",
        message: error.message || "Falha ao confirmar entrega.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="space-y-4 rounded-2xl bg-white p-4 shadow-sm sm:p-6">
      <div className="rounded-xl bg-slate-100 p-4">
        <p className="text-xs font-semibold uppercase text-slate-500">Delivery ID</p>
        <p className="text-lg font-bold text-slate-900">{resolvedDeliveryId}</p>
        {scannedLocation ? (
          <p className="mt-2 text-xs text-slate-600">
            Localização do escaneamento: {scannedLocation.latitude.toFixed(6)},{" "}
            {scannedLocation.longitude.toFixed(6)}
          </p>
        ) : (
          <p className="mt-2 text-xs text-amber-700">
            Escaneamento sem geolocalização (permissão negada ou indisponível).
          </p>
        )}
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-1">
          <label className="text-sm font-semibold text-slate-700" htmlFor="nomeRecebedor">
            Nome do recebedor *
          </label>
          <input
            className="form-input"
            id="nomeRecebedor"
            name="nomeRecebedor"
            onChange={handleInputChange}
            placeholder="Nome completo"
            value={formValues.nomeRecebedor}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-semibold text-slate-700" htmlFor="documento">
            Documento *
          </label>
          <input
            className="form-input"
            id="documento"
            name="documento"
            onChange={handleInputChange}
            placeholder="CPF, RG ou documento interno"
            value={formValues.documento}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-semibold text-slate-700" htmlFor="observacoes">
            Observações
          </label>
          <textarea
            className="form-input min-h-24 resize-y"
            id="observacoes"
            name="observacoes"
            onChange={handleInputChange}
            placeholder="Informações adicionais da entrega"
            value={formValues.observacoes}
          />
        </div>

        <PhotoCapture onCapture={setPhoto} />
        <SignaturePad onChange={setSignature} />

        <FeedbackBanner type={feedback.type} message={feedback.message} />

        <button className="btn-primary w-full" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Confirmando..." : "Confirmar Entrega"}
        </button>
      </form>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Link className="btn-secondary w-full" to="/scan">
          Escanear outro QR
        </Link>
        <Link className="btn-secondary w-full" to="/admin">
          Ver entregas
        </Link>
      </div>
    </section>
  );
}

export default ConfirmPage;
