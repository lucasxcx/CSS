import { useEffect, useState } from "react";
import FeedbackBanner from "../components/FeedbackBanner";
import { fetchDeliveries, getApiBaseUrl } from "../services/api";

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
        <h2 className="text-lg font-bold text-slate-900">Painel administrativo</h2>
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
              <p className="text-sm font-semibold text-slate-900">
                Delivery ID: {delivery.delivery_id}
              </p>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
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
              <p>
                <strong>Data:</strong>{" "}
                {new Date(delivery.created_at).toLocaleString("pt-BR")}
              </p>
            </div>
            {delivery.foto && (
              <img
                alt={`Foto da entrega ${delivery.delivery_id}`}
                className="mt-3 max-h-48 w-full rounded-xl border border-slate-200 object-cover"
                src={`${getApiBaseUrl()}${delivery.foto}`}
              />
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

export default AdminPage;
