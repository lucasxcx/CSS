import { useState } from "react";
import { Link } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";

const SUGGESTED_IDS = ["PED-1001", "PED-1002", "PED-1003"];

function QrGeneratorPage() {
  const [deliveryId, setDeliveryId] = useState(SUGGESTED_IDS[0]);
  const qrValue = `delivery_id:${deliveryId}`;

  return (
    <section className="space-y-4 rounded-2xl bg-white p-4 shadow-sm sm:p-6">
      <h2 className="text-lg font-bold text-slate-900">Gerador de QR Code (teste)</h2>
      <p className="text-sm text-slate-600">
        Use este QR para simular entregas durante o desenvolvimento.
      </p>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-700" htmlFor="delivery-id">
          Delivery ID
        </label>
        <input
          className="form-input"
          id="delivery-id"
          value={deliveryId}
          onChange={(event) => setDeliveryId(event.target.value.toUpperCase())}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {SUGGESTED_IDS.map((suggestedId) => (
          <button
            className="btn-secondary"
            key={suggestedId}
            onClick={() => setDeliveryId(suggestedId)}
            type="button"
          >
            {suggestedId}
          </button>
        ))}
      </div>

      <div className="flex flex-col items-center rounded-xl border border-slate-200 p-5">
        <QRCodeCanvas value={qrValue} size={220} />
        <code className="mt-3 rounded-lg bg-slate-100 px-3 py-1 text-xs text-slate-700">
          {qrValue}
        </code>
      </div>

      <Link className="btn-primary w-full" to="/scan">
        Ir para escaneamento
      </Link>
    </section>
  );
}

export default QrGeneratorPage;
