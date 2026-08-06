import { createContext, useContext, useState } from "react";
import { realizarCheckout, subirComprobante } from "../services/api.js";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [seleccion, setSeleccion] = useState(null); // { sorteo, paquete }
  const [comprador, setComprador] = useState(null);
  const [metodoPago, setMetodoPago] = useState("tarjeta");
  const [ultimaCompra, setUltimaCompra] = useState(null);

  const elegirPaquete = (sorteo, paquete) => setSeleccion({ sorteo, paquete });

  const confirmarCompra = async (comprobanteFile) => {
    if (!seleccion || !comprador) return null;

    const data = await realizarCheckout({
      sorteoId: seleccion.sorteo.id,
      cantidad: seleccion.paquete.boletos,
      comprador,
      metodoPago,
    });

    if (comprobanteFile) {
      try {
        await subirComprobante(data.compraId, comprobanteFile);
      } catch (err) {
        console.error("Error al subir comprobante:", err);
      }
    }

    const compra = {
      compraId: data.compraId,
      codigo: data.codigo,
      boletos: data.boletos,
      sorteoNombre: data.sorteoNombre,
      total: data.total,
      fecha: new Date().toISOString(),
      sorteo: seleccion.sorteo,
      paquete: seleccion.paquete,
      comprador,
      metodoPago,
    };
    setUltimaCompra(compra);
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
    reiniciarFlujo,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp debe usarse dentro de AppProvider");
  return ctx;
};
