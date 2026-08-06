import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Icon from "../icons/Icon.jsx";
import { realizarCheckout, subirComprobante } from "../services/api.js";
import { formatMoney } from "../utils/format.js";
import styles from "./MetodoPago.module.css";

const brandChip = (icon) => {
  switch (icon) {
    case "card":
      return (
        <span className={styles.brandChip}>
          <span className={styles.visa}>VISA</span>
          <span className={styles.mastercard} />
        </span>
      );
    case "qr":
      return <Icon name="qr" size={26} strokeWidth={1.4} className={styles.brandIcon} />;
    case "bank":
      return <Icon name="bank" size={24} strokeWidth={1.6} className={styles.brandIcon} />;
    case "deuna":
      return <span className={`${styles.brandChip} ${styles.deuna}`}>deuna!</span>;
    case "paypal":
      return <span className={`${styles.brandChip} ${styles.paypal}`}>PayPal</span>;
    default:
      return null;
  }
};

export default function MetodoPago() {
  const navigate = useNavigate();
  const { seleccion, comprador, metodoPago, setMetodoPago, confirmarCompra } = useApp();
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    if (!seleccion || !comprador) navigate("/sorteos", { replace: true });
  }, [seleccion, comprador, navigate]);

  if (!seleccion || !comprador) return null;

  const { sorteo, paquete } = seleccion;

  const pagar = () => {
    setProcesando(true);
    setTimeout(() => {
      confirmarCompra();
      navigate("/checkout/exito");
    }, 900);
  };

  return (
    <div className="page">
      <Navbar variant="checkout" step="pago" />

      <div className={`container ${styles.wrap}`}>
        <Link to="/checkout/datos" className={styles.volver}>
          <Icon name="chevronLeft" size={16} /> Volver
        </Link>

        <div className={styles.grid}>
          <div className={styles.metodos}>
            <h1>Selecciona un método de pago</h1>

            <div className={styles.lista}>
              {metodosPago.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={`${styles.metodo} ${metodoPago === m.id ? styles.metodoActivo : ""}`}
                  onClick={() => setMetodoPago(m.id)}
                >
                  <span className={styles.radio}>
                    {metodoPago === m.id && <span className={styles.radioDot} />}
                  </span>
                  <span className={styles.metodoInfo}>
                    <strong>{m.nombre}</strong>
                    <span>{m.detalle}</span>
                  </span>
                  {brandChip(m.icon)}
                </button>
              ))}
            </div>

            <div className={styles.fileInputBox}>
              <label>Subir foto del comprobante (opcional):</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setComprobanteFile(e.target.files[0])}
                style={{ marginTop: "6px", fontSize: "13px" }}
              />
            </div>

            {error && <div style={{ color: "#ef4444", fontSize: "13px", marginTop: "10px" }}>⚠️ {error}</div>}

            <button className="btn btn-primary btn-full" onClick={handleConfirmar} disabled={procesando} style={{ marginTop: "20px" }}>
              {procesando ? "Procesando compra..." : "Confirmar y Pagar"} <Icon name="arrowRight" size={18} />
            </button>
          </div>

          <div className={styles.resumen}>
            <h3>Resumen de tu compra</h3>

            <div className={styles.resumenItem}>
              <div className={styles.resumenImg}>
                <PremioImage categoria={sorteo.categoria} iconSize={22} />
              </div>
              <span>{sorteo.nombre}</span>
            </div>

            <div className={styles.resumenRows}>
              <div className={styles.resumenRow}>
                <span>Paquete seleccionado</span>
                <strong>{paquete.nombre} ({paquete.boletos} boleto{paquete.boletos > 1 ? "s" : ""})</strong>
              </div>
              <div className={styles.resumenRow}>
                <span>Precio por boleto</span>
                <strong>{formatMoney(sorteo.precio)}</strong>
              </div>
              <div className={styles.resumenRow}>
                <span>Cantidad de boletos</span>
                <strong>{paquete.boletos}</strong>
              </div>
            </div>

            <div className={styles.totalRow}>
              <span>Total a pagar</span>
              <strong>{formatMoney(paquete.precio)}</strong>
            </div>

            <div className={styles.seguridad}>
              <span><Icon name="shield" size={14} /> Pago 100% seguro</span>
              <span><Icon name="lock" size={14} /> Encriptación SSL</span>
            </div>

            <button
              type="button"
              className={`btn btn-primary btn-block ${styles.pagarBtn}`}
              onClick={pagar}
              disabled={procesando}
            >
              {procesando ? "Procesando..." : (
                <>
                  Pagar ahora <Icon name="lock" size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
