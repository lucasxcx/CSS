import { Link, Navigate, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ScanPage from "./pages/ScanPage";
import ConfirmPage from "./pages/ConfirmPage";
import AdminPage from "./pages/AdminPage";
import QrGeneratorPage from "./pages/QrGeneratorPage";

function App() {
  return (
    <div className="mx-auto min-h-screen max-w-4xl px-4 py-5 sm:px-6">
      <header className="mb-6 rounded-2xl bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h1 className="text-xl font-bold text-red-900">Entrega QR</h1>
          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
            Fluxo móvel
          </span>
        </div>
        <nav className="flex flex-wrap gap-2">
          <Link className="btn-secondary" to="/">
            Início
          </Link>
          <Link className="btn-secondary" to="/scan">
            Escanear
          </Link>
          <Link className="btn-secondary" to="/qr-generator">
            QR de teste
          </Link>
          <Link className="btn-secondary" to="/admin">
            Administrativo
          </Link>
        </nav>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/scan" element={<ScanPage />} />
          <Route path="/confirm/:deliveryId" element={<ConfirmPage />} />
          <Route path="/qr-generator" element={<QrGeneratorPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
