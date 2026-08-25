const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'sorteos_admin_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export async function fetchApi(endpoint, options = {}) {
  try {
    const token = getToken();
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
      ...options,
    });

    // Sesión deslizante: cada request autenticado exitoso trae un token renovado.
    const refreshed = res.headers.get('X-Refresh-Token');
    if (refreshed) setToken(refreshed);

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      if (res.status === 401 && token) {
        clearToken();
        localStorage.removeItem('sorteos_admin_user');
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/admin/login')) {
          window.location.href = '/admin/login';
        }
      }
      throw new Error(errData.error || `Error ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.error(`[API Error] ${endpoint}:`, err);
    throw err;
  }
}

// Sorteos API
export const getSorteos = (categoria = 'todos', estado = 'todos') =>
  fetchApi(`/sorteos?categoria=${categoria}&estado=${estado}`);

export const getSorteoById = (id) => fetchApi(`/sorteos/${id}`);

export const createSorteo = (data) =>
  fetchApi('/sorteos', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const updateSorteo = (id, data) =>
  fetchApi(`/sorteos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const deleteSorteo = (id) =>
  fetchApi(`/sorteos/${id}`, {
    method: 'DELETE',
  });

// Compras & Checkout API
export const realizarCheckout = (data) =>
  fetchApi('/compras/checkout', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const subirComprobante = async (compraId, file) => {
  const formData = new FormData();
  formData.append('comprobante', file);
  const res = await fetch(`${API_BASE_URL}/compras/${compraId}/comprobante`, {
    method: 'POST',
    body: formData,
  });
  return await res.json();
};

// PayPhone (cobro real con tarjeta)
export const iniciarPagoPayphone = (compraId) =>
  fetchApi(`/compras/${compraId}/payphone/iniciar`, { method: 'POST' });

export const confirmarPagoPayphone = (id, clientTransactionId) =>
  fetchApi('/compras/payphone/confirmar', {
    method: 'POST',
    body: JSON.stringify({ id, clientTransactionId }),
  });

export const buscarBoletosPorCedula = (cedula) =>
  fetchApi(`/compras/buscar?cedula=${encodeURIComponent(cedula)}`);

// Admin API
export const getAdminCompras = () => fetchApi('/admin/compras');

export const updateEstadoCompra = (id, estado) =>
  fetchApi(`/admin/compras/${id}/estado`, {
    method: 'PUT',
    body: JSON.stringify({ estado }),
  });

export const getAdminDashboard = () => fetchApi('/admin/dashboard');

export const getBoletosAdmin = (sorteoId) => fetchApi(`/admin/sorteos/${sorteoId}/boletos`);

// Auth API
export const login = (usuario, password) =>
  fetchApi('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ usuario, password }),
  });

// Ganadores API
export const getGanadores = () => fetchApi('/ganadores');

export const sortearGanador = (sorteoId) =>
  fetchApi(`/admin/sorteos/${sorteoId}/sortear`, { method: 'POST' });

export const actualizarGanador = (id, data) =>
  fetchApi(`/admin/ganadores/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

// Categorías API
export const getCategorias = () => fetchApi('/categorias');

export const createCategoria = (data) =>
  fetchApi('/categorias', { method: 'POST', body: JSON.stringify(data) });

export const updateCategoria = (id, data) =>
  fetchApi(`/categorias/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteCategoria = (id) =>
  fetchApi(`/categorias/${id}`, { method: 'DELETE' });

// Descuentos por volumen API
export const getDescuentos = () => fetchApi('/descuentos');

export const createDescuento = (data) =>
  fetchApi('/admin/descuentos', { method: 'POST', body: JSON.stringify(data) });

export const updateDescuento = (id, data) =>
  fetchApi(`/admin/descuentos/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteDescuento = (id) =>
  fetchApi(`/admin/descuentos/${id}`, { method: 'DELETE' });

// Clientes (admin) API
export const getAdminClientes = () => fetchApi('/admin/clientes');

export const getClienteHistorial = (id) => fetchApi(`/admin/clientes/${id}/compras`);

export const toggleBloqueoCliente = (id, bloqueado) =>
  fetchApi(`/admin/clientes/${id}/bloqueo`, {
    method: 'PUT',
    body: JSON.stringify({ bloqueado }),
  });

// Reportes (admin) API
export const getAdminReportes = () => fetchApi('/admin/reportes');

// Configuración API
export const getConfiguracion = () => fetchApi('/configuracion');

export const updateConfiguracion = (data) =>
  fetchApi('/admin/configuracion', { method: 'PUT', body: JSON.stringify(data) });

// Cuenta del admin
export const updateAccount = (data) =>
  fetchApi('/admin/account', { method: 'PUT', body: JSON.stringify(data) });
