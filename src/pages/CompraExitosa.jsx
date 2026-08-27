import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Icon from "../icons/Icon.jsx";
import { useApp } from "../context/AppContext.jsx";
import { metodosPago } from "../data/sorteos.js";
import { getConfiguracion } from "../services/api.js";
import { formatDate, formatMoney } from "../utils/format.js";
import styles from "./CompraExitosa.module.css";

const confettiColors = ["#6d3cf5", "#e63950", "#f5a623", "#16a34a", "#2f6df5"];

export default function CompraExitosa() {
  const navigate = useNavigate();
  const { ultimaCompra, reiniciarFlujo } = useApp();
  const [instruccionesPago, setInstruccionesPago] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  useEffect(() => {
    if (!ultimaCompra) {
      navigate("/sorteos", { replace: true });
      return;
    }
    reiniciarFlujo();
    getConfiguracion()
      .then((config) => {
        setInstruccionesPago(config.instrucciones_pago || "");
        setWhatsapp(config.whatsapp || "");
      })
      .catch((err) => console.error("Error cargando configuración:", err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!ultimaCompra) return null;

  const metodo = metodosPago.find((m) => m.id === ultimaCompra.metodoPago);

  const descargarComprobante = () => {
    const contenido = `EL TRÉBOL DE GAYA - Comprobante de compra
Código de orden: ${ultimaCompra.codigo}
Boletos: ${ultimaCompra.boletos.join(", ")}
Sorteo: ${ultimaCompra.sorteoNombre}
Cantidad: ${ultimaCompra.paquete.boletos} boletos
Total pagado: ${formatMoney(ultimaCompra.total)}
Fecha: ${formatDate(ultimaCompra.fecha)}
Método de pago: ${metodo?.nombre || ""}
Comprador: ${ultimaCompra.comprador.nombre}
`;
    const blob = new Blob([contenido], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `comprobante-${ultimaCompra.codigo}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const compartir = async () => {
    const texto = `¡Ya estoy participando en el sorteo de ${ultimaCompra.sorteoNombre} en EL TRÉBOL DE GAYA! Mis boletos: ${ultimaCompra.boletos.join(", ")}`;
    if (navigator.share) {
      try {
        await navigator.share({ text: texto, title: "El Trébol de Gaya" });
      } catch {
        // usuario canceló, no hacer nada
      }
    } else {
      const waUrl = `https://wa.me/?text=${encodeURIComponent(texto)}`;
      window.open(waUrl, "_blank");
    }
  };

  const irAConsultarBoletos = () => navigate("/consultar-boletos");

  return (
    <div className="page">
      <Navbar variant="cart" />

      <div className={`container ${styles.wrap}`}>
        <div className={styles.card}>
          <div className={styles.confetti}>
            {Array.from({ length: 18 }).map((_, i) => (
              <span
                key={i}
                style={{
                  left: `${(i * 53) % 100}%`,
                  background: confettiColors[i % confettiColors.length],
                  animationDelay: `${(i % 6) * 0.2}s`,
                }}
              />
            ))}
          </div>

          <div className={styles.checkWrap}>
            <Icon name="check" size={34} strokeWidth={3} />
          </div>

          <h1>¡Compra realizada con éxito!</h1>
          <p className={styles.subtitle}>Gracias por tu compra, ya estás participando.</p>

          <div className={styles.boletosBox}>
            <span>Tus boletos (números aleatorios)</span>
            <strong>{ultimaCompra.boletos.map((n) => `#${n}`).join(", ")}</strong>
          </div>

          <div className={styles.detalle}>
            <div className={styles.detalleRow}>
              <span>Sorteo</span>
              <strong>{ultimaCompra.sorteoNombre}</strong>
            </div>
            <div className={styles.detalleRow}>
              <span>Código de orden</span>
              <strong>{ultimaCompra.codigo}</strong>
            </div>
            <div className={styles.detalleRow}>
              <span>Paquete</span>
              <strong>{ultimaCompra.paquete.nombre} ({ultimaCompra.paquete.boletos} boleto{ultimaCompra.paquete.boletos > 1 ? "s" : ""})</strong>
            </div>
            <div className={styles.detalleRow}>
              <span>Total pagado</span>
              <strong>{formatMoney(ultimaCompra.total)}</strong>
            </div>
            <div className={styles.detalleRow}>
              <span>Fecha</span>
              <strong>{formatDate(ultimaCompra.fecha)}</strong>
            </div>
            <div className={styles.detalleRow}>
              <span>Método de pago</span>
              <strong>{metodo?.nombre}</strong>
            </div>
          </div>

          {ultimaCompra.metodoPago === "transferencia" && (
            <div style={{ margin: "20px 0", background: "#f8fafc", border: "1px dashed #cbd5e1", borderRadius: "8px", padding: "16px", textAlign: "left" }}>
              <h4 style={{ fontSize: "14px", fontWeight: "800", color: "#0f172a", marginBottom: "10px" }}>
                🏦 Cuentas Bancarias para Realizar tu Transferencia:
              </h4>

              {instruccionesPago ? (
                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "10px 12px", marginBottom: "8px", whiteSpace: "pre-line", fontSize: "12.5px", color: "#0f172a" }}>
                  {instruccionesPago}
                </div>
              ) : (
                <p style={{ fontSize: "12.5px", color: "#64748b" }}>
                  {whatsapp
                    ? <>Escríbenos por WhatsApp al <strong>{whatsapp}</strong> y te enviamos los datos de la cuenta para tu transferencia.</>
                    : "Por favor contáctanos para que te enviemos los datos de la cuenta para tu transferencia."}
                </p>
              )}

              <p style={{ fontSize: "12px", color: "#64748b", marginTop: "10px", marginBottom: "14px" }}>
                Por favor, realiza la transferencia por el total e indica tu código de orden <strong>{ultimaCompra.codigo}</strong>.
              </p>

              {/* Carga de Comprobante en la Pantalla de Éxito */}
              <div style={{ background: "#ffffff", border: "1px dashed #6d3cf5", borderRadius: "6px", padding: "14px", marginTop: "10px" }}>
                <strong style={{ display: "block", fontSize: "13px", color: "#1e293b", marginBottom: "6px" }}>
                  📤 Adjunta aquí tu comprobante de pago:
                </strong>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (file && ultimaCompra.compraId) {
                      try {
                        const { subirComprobante } = await import("../services/api.js");
                        await subirComprobante(ultimaCompra.compraId, file);
                        alert("¡Comprobante subido con éxito! El administrador revisará tu pago.");
                      } catch (err) {
                        alert(err.message || "Error al subir comprobante");
                      }
                    }
                  }}
                  style={{ fontSize: "12.5px", width: "100%" }}
                />
              </div>
            </div>
          )}

          <div className={styles.acciones}>
            <div className={styles.accionesFila}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={descargarComprobante}>
                <Icon name="download" size={16} /> Descargar comprobante
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={compartir}>
                <Icon name="share" size={16} /> Compartir
              </button>
            </div>
            <button type="button" className="btn btn-primary btn-block" onClick={irAConsultarBoletos}>
              Ver mis boletos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
