import { Link } from "react-router-dom";

function HomePage() {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-bold text-slate-900">Confirmação de Entregas</h2>
      <p className="mt-2 text-sm text-slate-600">
        Escaneie o QR Code da encomenda para registrar a confirmação com dados do recebedor.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Link className="btn-primary w-full" to="/scan">
          Escanear QR Code
        </Link>
        <Link className="btn-secondary w-full" to="/qr-generator">
          Gerar QR de teste
        </Link>
      </div>
    </section>
  );
}

export default HomePage;
