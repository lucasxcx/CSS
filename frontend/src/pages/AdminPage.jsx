import { useEffect, useState } from "react";
import FeedbackBanner from "../components/FeedbackBanner";
import { fetchDeliveries } from "../services/api";

function AdminPage() {
  const [deliveries, setDeliveries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadDeliveries = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");
      const response = await fetchDeliveries();
      setDeliveries(response.data || []);
    } catch (error) {
      setErrorMessage(error.message || "Não foi possível carregar as entregas.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDeliveries();
  }, []);

  return (
    <section className="space-y-4 rounded-2xl bg-white p-4 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-red-900">Painel administrativo</h2>
        <button className="btn-secondary" onClick={loadDeliveries} type="button">
          Atualizar
        </button>
      </div>

      <FeedbackBanner
        type="info"
        message={isLoading ? "Carregando entregas..." : ""}
      />
      <FeedbackBanner type="error" message={errorMessage} />

      <div className="space-y-3">
        {deliveries.length === 0 && !isLoading && (
          <p className="rounded-xl border border-slate-200 p-4 text-sm text-slate-500">
            Nenhuma entrega confirmada ainda.
          </p>
        )}

        {deliveries.map((delivery) => (
          <article
            className="rounded-xl border border-slate-200 p-4"
            key={delivery.id}
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-red-900">
                Delivery ID: {delivery.delivery_id}
              </p>
              <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                {delivery.status}
              </span>
            </div>
            <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
              <p>
                <strong>Recebedor:</strong> {delivery.nome_recebedor}
              </p>
              <p>
                <strong>Documento:</strong> {delivery.documento}
              </p>
              <p className="sm:col-span-2">
                <strong>Observações:</strong> {delivery.observacoes || "-"}
              </p>
              <p className="sm:col-span-2">
                <strong>Geolocalização do escaneamento:</strong>{" "}
                {delivery.scan_latitude !== null && delivery.scan_longitude !== null
                  ? `${Number(delivery.scan_latitude).toFixed(6)}, ${Number(delivery.scan_longitude).toFixed(6)}`
                  : "Não informada"}
              </p>
              <p>
                <strong>Data:</strong>{" "}
                {new Date(delivery.created_at).toLocaleString("pt-BR")}
              </p>
            </div>
            {delivery.scan_accuracy !== null && (
              <p className="mt-3 text-xs text-slate-500">
                <strong>Precisão aproximada:</strong> {Math.round(Number(delivery.scan_accuracy))} m
              </p>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

export default AdminPage;
