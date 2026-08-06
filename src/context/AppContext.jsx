import { createContext, useContext, useEffect, useState } from "react";
import { generarNumeroBoleto, generarNumeroCompra } from "../utils/format.js";

const AppContext = createContext(null);

const ORDERS_KEY = "tickets3d_orders";

const loadOrders = () => {
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export function AppProvider({ children }) {
  const [seleccion, setSeleccion] = useState(null); // { sorteo, paquete }
  const [comprador, setComprador] = useState(null);
  const [metodoPago, setMetodoPago] = useState("tarjeta");
  const [ultimaCompra, setUltimaCompra] = useState(null);
  const [orders, setOrders] = useState(loadOrders);

  useEffect(() => {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  }, [orders]);

  const elegirPaquete = (sorteo, paquete) => setSeleccion({ sorteo, paquete });

  const confirmarCompra = () => {
    if (!seleccion || !comprador) return null;
    const compra = {
      numeroCompra: generarNumeroCompra(),
      numeroBoleto: generarNumeroBoleto(),
      fecha: new Date().toISOString(),
      sorteo: seleccion.sorteo,
      paquete: seleccion.paquete,
      comprador,
      metodoPago,
      total: seleccion.paquete.precio,
    };
    setUltimaCompra(compra);
    setOrders((prev) => [compra, ...prev]);
    return compra;
  };

  const reiniciarFlujo = () => {
    setSeleccion(null);
    setComprador(null);
    setMetodoPago("tarjeta");
  };

  const value = {
    seleccion,
    elegirPaquete,
    comprador,
    setComprador,
    metodoPago,
    setMetodoPago,
    ultimaCompra,
    confirmarCompra,
    orders,
    reiniciarFlujo,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp debe usarse dentro de AppProvider");
  return ctx;
};
