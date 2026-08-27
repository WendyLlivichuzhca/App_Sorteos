import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { AppProvider } from "./context/AppContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

// Cliente Pages
import Landing from "./pages/Landing.jsx";
import Sorteos from "./pages/Sorteos.jsx";
import SorteoDetalle from "./pages/SorteoDetalle.jsx";
import Paquetes from "./pages/Paquetes.jsx";
import Checkout from "./pages/Checkout.jsx";
import CompraExitosa from "./pages/CompraExitosa.jsx";
import PayphoneConfirmacion from "./pages/PayphoneConfirmacion.jsx";
import ConsultarBoletos from "./pages/ConsultarBoletos.jsx";
import Resultados from "./pages/Resultados.jsx";
import Ayuda from "./pages/Ayuda.jsx";

// Admin Pages (Separated Folders)
import AdminLogin from "./pages/admin/AdminLogin.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminSorteos from "./pages/admin/AdminSorteos.jsx";
import AdminCategorias from "./pages/admin/AdminCategorias.jsx";
import AdminPaquetes from "./pages/admin/AdminPaquetes.jsx";
import AdminBoletos from "./pages/admin/AdminBoletos.jsx";
import AdminCompras from "./pages/admin/AdminCompras.jsx";
import AdminClientes from "./pages/admin/AdminClientes.jsx";
import AdminGanadores from "./pages/admin/AdminGanadores.jsx";
import AdminSorteoEnVivo from "./pages/admin/AdminSorteoEnVivo.jsx";
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
      <AuthProvider>
        <AppProvider>
          <ScrollToTop />
          <Routes>
            {/* Rutas Cliente */}
            <Route path="/" element={<Landing />} />
            <Route path="/sorteos" element={<Sorteos />} />
            <Route path="/sorteos/:id" element={<SorteoDetalle />} />
            <Route path="/sorteos/:id/paquetes" element={<Paquetes />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/checkout/datos" element={<Checkout />} />
            <Route path="/checkout/pago" element={<Checkout />} />
            <Route path="/checkout/exito" element={<CompraExitosa />} />
            <Route path="/checkout/payphone/confirmacion" element={<PayphoneConfirmacion />} />
            <Route path="/consultar-boletos" element={<ConsultarBoletos />} />
            <Route path="/resultados" element={<Resultados />} />
            <Route path="/ayuda" element={<Ayuda />} />

            {/* Login Administrador */}
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* Rutas Administrador (protegidas) */}
            <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/sorteos" element={<ProtectedRoute><AdminSorteos /></ProtectedRoute>} />
            <Route path="/admin/categorias" element={<ProtectedRoute><AdminCategorias /></ProtectedRoute>} />
            <Route path="/admin/paquetes" element={<ProtectedRoute><AdminPaquetes /></ProtectedRoute>} />
            <Route path="/admin/boletos" element={<ProtectedRoute><AdminBoletos /></ProtectedRoute>} />
            <Route path="/admin/compras" element={<ProtectedRoute><AdminCompras /></ProtectedRoute>} />
            <Route path="/admin/clientes" element={<ProtectedRoute><AdminClientes /></ProtectedRoute>} />
            <Route path="/admin/ganadores" element={<ProtectedRoute><AdminGanadores /></ProtectedRoute>} />
            <Route path="/admin/ganadores/en-vivo" element={<ProtectedRoute><AdminSorteoEnVivo /></ProtectedRoute>} />
            <Route path="/admin/reportes" element={<ProtectedRoute><AdminReportes /></ProtectedRoute>} />
            <Route path="/admin/configuracion" element={<ProtectedRoute><AdminConfiguracion /></ProtectedRoute>} />
            <Route path="/admin/administradores" element={<ProtectedRoute><AdminUsuarios /></ProtectedRoute>} />
          </Routes>
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
