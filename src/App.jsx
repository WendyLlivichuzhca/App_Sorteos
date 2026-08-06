import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { AppProvider } from "./context/AppContext.jsx";

// Cliente Pages
import Landing from "./pages/Landing.jsx";
import Sorteos from "./pages/Sorteos.jsx";
import SorteoDetalle from "./pages/SorteoDetalle.jsx";
import Paquetes from "./pages/Paquetes.jsx";
import DatosComprador from "./pages/DatosComprador.jsx";
import MetodoPago from "./pages/MetodoPago.jsx";
import CompraExitosa from "./pages/CompraExitosa.jsx";
import ConsultarBoletos from "./pages/ConsultarBoletos.jsx";
import Resultados from "./pages/Resultados.jsx";
import Ayuda from "./pages/Ayuda.jsx";

// Admin Pages (Separated Folders)
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminSorteos from "./pages/admin/AdminSorteos.jsx";
import AdminCategorias from "./pages/admin/AdminCategorias.jsx";
import AdminPaquetes from "./pages/admin/AdminPaquetes.jsx";
import AdminBoletos from "./pages/admin/AdminBoletos.jsx";
import AdminCompras from "./pages/admin/AdminCompras.jsx";
import AdminClientes from "./pages/admin/AdminClientes.jsx";
import AdminGanadores from "./pages/admin/AdminGanadores.jsx";
import AdminReportes from "./pages/admin/AdminReportes.jsx";
import AdminConfiguracion from "./pages/admin/AdminConfiguracion.jsx";
import AdminUsuarios from "./pages/admin/AdminUsuarios.jsx";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <ScrollToTop />
        <Routes>
          {/* Rutas Cliente */}
          <Route path="/" element={<Landing />} />
          <Route path="/sorteos" element={<Sorteos />} />
          <Route path="/sorteos/:id" element={<SorteoDetalle />} />
          <Route path="/sorteos/:id/paquetes" element={<Paquetes />} />
          <Route path="/checkout/datos" element={<DatosComprador />} />
          <Route path="/checkout/pago" element={<MetodoPago />} />
          <Route path="/checkout/exito" element={<CompraExitosa />} />
          <Route path="/consultar-boletos" element={<ConsultarBoletos />} />
          <Route path="/resultados" element={<Resultados />} />
          <Route path="/ayuda" element={<Ayuda />} />

          {/* Rutas Administrador */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/sorteos" element={<AdminSorteos />} />
          <Route path="/admin/categorias" element={<AdminCategorias />} />
          <Route path="/admin/paquetes" element={<AdminPaquetes />} />
          <Route path="/admin/boletos" element={<AdminBoletos />} />
          <Route path="/admin/compras" element={<AdminCompras />} />
          <Route path="/admin/clientes" element={<AdminClientes />} />
          <Route path="/admin/ganadores" element={<AdminGanadores />} />
          <Route path="/admin/reportes" element={<AdminReportes />} />
          <Route path="/admin/configuracion" element={<AdminConfiguracion />} />
          <Route path="/admin/administradores" element={<AdminUsuarios />} />
        </Routes>
      </AppProvider>
    </BrowserRouter>
  );
}
