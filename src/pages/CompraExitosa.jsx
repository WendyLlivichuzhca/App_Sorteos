import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Icon from "../icons/Icon.jsx";
import { useApp } from "../context/AppContext.jsx";
import { metodosPago } from "../data/sorteos.js";
import { getConfiguracion } from "../services/api.js";
import { formatDate, formatMoney } from "../utils/format.js";
import styles from "./CompraExitosa.module.css";

const confettiColors = ["#1F8A5A", "#e63950", "#f5a623", "#16a34a", "#2f6df5"];

export default function CompraExitosa() {
  const navigate = useNavigate();
  const { ultimaCompra, reiniciarFlujo } = useApp();
  const [instruccionesPago, setInstruccionesPago] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [qrPago, setQrPago] = useState("");
  const [nombreEmpresa, setNombreEmpresa] = useState("El Trébol de Gaya");

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
        setQrPago(config.qr_pago || "");
        setNombreEmpresa(config.nombre_empresa || "El Trébol de Gaya");
      })
      .catch((err) => console.error("Error cargando configuración:", err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!ultimaCompra) return null;

  const metodo = metodosPago.find((m) => m.id === ultimaCompra.metodoPago);

  const generarComprobantePdf = async () => {
    const { default: jsPDF } = await import("jspdf");
    const verde = [31, 138, 90];
    const verdeOscuro = [20, 107, 69];
    const oscuro = [16, 21, 18];
    const gris = [91, 102, 96];
    const bordeGris = [222, 228, 224];
    const fondoSuave = [237, 247, 241];
    const margenX = 20;
    const anchoPag = 210;
    const anchoUtil = anchoPag - margenX * 2;

    const doc = new jsPDF({ unit: "mm", format: "a4" });

    // Encabezado
    doc.setFillColor(...verde);
    doc.rect(0, 0, anchoPag, 12, "F");

    let y = 30;
    doc.setTextColor(...oscuro);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(nombreEmpresa, margenX, y);
    doc.setTextColor(...verde);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text("Comprobante de compra", margenX, y + 7);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...oscuro);
    doc.text(`N.º ${ultimaCompra.codigo}`, anchoPag - margenX, y, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...gris);
    doc.text(formatDate(ultimaCompra.fecha), anchoPag - margenX, y + 6, { align: "right" });

    y += 16;
    doc.setDrawColor(...bordeGris);
    doc.line(margenX, y, anchoPag - margenX, y);

    // Facturado a
    y += 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...gris);
    doc.text("FACTURADO A", margenX, y);
    y += 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...oscuro);
    doc.text(ultimaCompra.comprador.nombre, margenX, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...gris);
    const datosComprador = [
      ultimaCompra.comprador.cedula,
      ultimaCompra.comprador.correo,
      ultimaCompra.comprador.celular,
    ].filter(Boolean).join("  ·  ");
    doc.text(datosComprador, margenX, y);

    // Tabla: encabezado
    y += 12;
    const colConcepto = margenX;
    const colCantidad = margenX + 98;
    const colPrecio = margenX + 122;
    const colSubtotal = anchoPag - margenX;

    doc.setFillColor(...verde);
    doc.rect(margenX, y, anchoUtil, 9, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("CONCEPTO", colConcepto + 3, y + 6);
    doc.text("CANT.", colCantidad, y + 6);
    doc.text("P. UNITARIO", colPrecio, y + 6);
    doc.text("SUBTOTAL", colSubtotal - 3, y + 6, { align: "right" });

    // Tabla: fila de datos
    y += 9;
    const precioUnitario = ultimaCompra.total / ultimaCompra.paquete.boletos;
    doc.setDrawColor(...bordeGris);
    doc.rect(margenX, y, anchoUtil, 14);
    doc.setTextColor(...oscuro);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    const nombreConcepto = doc.splitTextToSize(`${ultimaCompra.sorteoNombre}`, 92);
    doc.text(nombreConcepto, colConcepto + 3, y + 6);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...gris);
    doc.text("Boletos de participación", colConcepto + 3, y + 11);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...oscuro);
    doc.text(String(ultimaCompra.paquete.boletos), colCantidad, y + 8);
    doc.text(formatMoney(precioUnitario), colPrecio, y + 8);
    doc.setFont("helvetica", "bold");
    doc.text(formatMoney(ultimaCompra.total), colSubtotal - 3, y + 8, { align: "right" });

    // Total
    y += 14 + 4;
    doc.setDrawColor(...bordeGris);
    doc.line(margenX + 100, y, anchoPag - margenX, y);
    y += 8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...gris);
    doc.text("TOTAL PAGADO", colPrecio, y);
    doc.setFontSize(15);
    doc.setTextColor(...verdeOscuro);
    doc.text(formatMoney(ultimaCompra.total), colSubtotal - 3, y, { align: "right" });

    // Números de boletos asignados
    y += 14;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...oscuro);
    doc.text("Números de boletos asignados", margenX, y);
    y += 5;
    const listaBoletos = doc.splitTextToSize(ultimaCompra.boletos.map((n) => `#${n}`).join("   "), anchoUtil - 10);
    const altoCaja = listaBoletos.length * 5 + 8;
    doc.setFillColor(...fondoSuave);
    doc.roundedRect(margenX, y, anchoUtil, altoCaja, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...verdeOscuro);
    doc.text(listaBoletos, margenX + 5, y + 6);
    y += altoCaja + 10;

    // Método de pago
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...gris);
    doc.text("Método de pago", margenX, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...oscuro);
    doc.text(metodo?.nombre || "", margenX + 40, y);

    // Pie
    y += 16;
    doc.setDrawColor(...bordeGris);
    doc.line(margenX, y, anchoPag - margenX, y);
    y += 8;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(...gris);
    doc.text("Gracias por tu compra. Guarda este comprobante como respaldo de tu participación.", anchoPag / 2, y, { align: "center" });
    y += 5;
    doc.setFontSize(8);
    doc.text("Documento generado automáticamente, no requiere firma.", anchoPag / 2, y, { align: "center" });

    return doc;
  };

  const descargarComprobante = async () => {
    const doc = await generarComprobantePdf();
    doc.save(`comprobante-${ultimaCompra.codigo}.pdf`);
  };

  const compartir = async () => {
    const texto = `¡Ya estoy participando en el sorteo de ${ultimaCompra.sorteoNombre} en ${nombreEmpresa}! Mis boletos: ${ultimaCompra.boletos.join(", ")}`;

    try {
      const doc = await generarComprobantePdf();
      const blob = doc.output("blob");
      const archivo = new File([blob], `comprobante-${ultimaCompra.codigo}.pdf`, { type: "application/pdf" });

      if (navigator.canShare && navigator.canShare({ files: [archivo] })) {
        await navigator.share({ files: [archivo] });
        return;
      }
      if (navigator.share) {
        await navigator.share({ text: texto, title: nombreEmpresa });
        return;
      }
    } catch {
      // usuario canceló el share nativo, no hacer nada
      return;
    }

    const waUrl = `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(waUrl, "_blank");
  };

  const irAConsultarBoletos = () => navigate("/consultar-boletos");

  return (
    <div className="page">
      <Navbar variant="cart" />

      <div className={styles.decorWrap}>
        <div className={`${styles.blob} ${styles.blob1}`} />
        <div className={`${styles.blob} ${styles.blob2}`} />
        <svg className={`${styles.leaf} ${styles.leaf1}`} viewBox="0 0 100 100" fill="none" aria-hidden="true"><path fill="currentColor" d="M50 5C25 15 10 40 15 65C20 88 45 98 68 90C88 83 95 60 85 40C75 20 60 8 50 5Z" /></svg>
        <svg className={`${styles.leaf} ${styles.leaf2}`} viewBox="0 0 100 100" fill="none" aria-hidden="true"><path fill="currentColor" d="M50 5C25 15 10 40 15 65C20 88 45 98 68 90C88 83 95 60 85 40C75 20 60 8 50 5Z" /></svg>
        <svg className={`${styles.leaf} ${styles.leaf3}`} viewBox="0 0 100 100" fill="none" aria-hidden="true"><path fill="currentColor" d="M50 5C25 15 10 40 15 65C20 88 45 98 68 90C88 83 95 60 85 40C75 20 60 8 50 5Z" /></svg>
        <svg className={`${styles.leaf} ${styles.leaf4}`} viewBox="0 0 100 100" fill="none" aria-hidden="true"><path fill="currentColor" d="M50 5C25 15 10 40 15 65C20 88 45 98 68 90C88 83 95 60 85 40C75 20 60 8 50 5Z" /></svg>

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
            ultimaCompra.comprobanteSubido ? (
              <div style={{ margin: "20px 0", background: "#FFFFFF", border: "1px solid #1F8A5A", borderRadius: "8px", padding: "14px 16px", textAlign: "left", color: "#146B45", fontSize: "13px", fontWeight: 600 }}>
                ✅ Ya recibimos tu comprobante de pago, está en revisión.
              </div>
            ) : (
              <div style={{ margin: "20px 0", background: "#F7FAF8", border: "1px dashed #D8DFDC", borderRadius: "8px", padding: "16px", textAlign: "left" }}>
                <h4 style={{ fontSize: "14px", fontWeight: "800", color: "#101512", marginBottom: "10px" }}>
                  🏦 Cuentas Bancarias para Realizar tu Transferencia:
                </h4>

                {instruccionesPago ? (
                  <div style={{ background: "#FFFFFF", border: "1px solid #E3E8E5", borderRadius: "6px", padding: "10px 12px", marginBottom: "8px", whiteSpace: "pre-line", fontSize: "12.5px", color: "#101512" }}>
                    {instruccionesPago}
                  </div>
                ) : (
                  <p style={{ fontSize: "12.5px", color: "#8B958F" }}>
                    {whatsapp
                      ? <>Escríbenos por WhatsApp al <strong>{whatsapp}</strong> y te enviamos los datos de la cuenta para tu transferencia.</>
                      : "Por favor contáctanos para que te enviemos los datos de la cuenta para tu transferencia."}
                  </p>
                )}

                <p style={{ fontSize: "12px", color: "#8B958F", marginTop: "10px", marginBottom: "14px" }}>
                  Por favor, realiza la transferencia por el total e indica tu código de orden <strong>{ultimaCompra.codigo}</strong>.
                </p>

                <div style={{ background: "#FFFFFF", border: "1px dashed #1F8A5A", borderRadius: "6px", padding: "14px", marginTop: "10px" }}>
                  <strong style={{ display: "block", fontSize: "13px", color: "#101512", marginBottom: "6px" }}>
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
            )
          )}

          {ultimaCompra.metodoPago === "qr" && (
            ultimaCompra.comprobanteSubido ? (
              <div style={{ margin: "20px 0", background: "#FFFFFF", border: "1px solid #1F8A5A", borderRadius: "8px", padding: "14px 16px", textAlign: "left", color: "#146B45", fontSize: "13px", fontWeight: 600 }}>
                ✅ Ya recibimos tu comprobante de pago, está en revisión.
              </div>
            ) : (
              <div style={{ margin: "20px 0", background: "#F7FAF8", border: "1px dashed #D8DFDC", borderRadius: "8px", padding: "16px", textAlign: "left" }}>
                <h4 style={{ fontSize: "14px", fontWeight: "800", color: "#101512", marginBottom: "10px" }}>
                  📱 Escanea el código QR para pagar con JEP Fácil:
                </h4>

                {qrPago ? (
                  <div style={{ textAlign: "center", marginBottom: "10px" }}>
                    <img
                      src={qrPago}
                      alt="Código QR para pagar con JEP Fácil"
                      style={{ width: "160px", height: "160px", objectFit: "contain", border: "1px solid #e2e8f0", borderRadius: "8px", background: "#fff" }}
                    />
                  </div>
                ) : (
                  <p style={{ fontSize: "12.5px", color: "#8B958F" }}>
                    {whatsapp
                      ? <>Escríbenos por WhatsApp al <strong>{whatsapp}</strong> y te enviamos el código QR para tu pago.</>
                      : "Por favor contáctanos para que te enviemos el código QR para tu pago."}
                  </p>
                )}

                <p style={{ fontSize: "12px", color: "#8B958F", marginTop: "10px", marginBottom: "14px" }}>
                  Por favor, realiza el pago por el total e indica tu código de orden <strong>{ultimaCompra.codigo}</strong>.
                </p>

                <div style={{ background: "#FFFFFF", border: "1px dashed #1F8A5A", borderRadius: "6px", padding: "14px", marginTop: "10px" }}>
                  <strong style={{ display: "block", fontSize: "13px", color: "#101512", marginBottom: "6px" }}>
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
            )
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
    </div>
  );
}
