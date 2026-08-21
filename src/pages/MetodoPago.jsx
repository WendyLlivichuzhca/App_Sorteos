import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Icon from "../icons/Icon.jsx";
import PremioImage from "../components/PremioImage.jsx";
import { useApp } from "../context/AppContext.jsx";
import { metodosPago as todosLosMetodosPago } from "../data/sorteos.js";
import { getConfiguracion } from "../services/api.js";
import { formatMoney } from "../utils/format.js";
import styles from "./MetodoPago.module.css";

export default function MetodoPago() {
  const navigate = useNavigate();
  const { seleccion, comprador, metodoPago, setMetodoPago, confirmarCompra } = useApp();
  const [comprobanteFile, setComprobanteFile] = useState(null);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");
  const [metodosPago, setMetodosPago] = useState(todosLosMetodosPago);
  const [instruccionesPago, setInstruccionesPago] = useState("");
  const [politicas, setPoliticas] = useState("");
  const [aceptaTerminos, setAceptaTerminos] = useState(false);

  useEffect(() => {
    // Por defecto seleccionar transferencia bancaria si no hay seleccionado
    if (!metodoPago || metodoPago === "deuna") {
      setMetodoPago("transferencia");
    }
    getConfiguracion()
      .then((config) => {
        const habilitados = config.metodosPago || {};
        setMetodosPago(todosLosMetodosPago.filter((m) => habilitados[m.id] !== false));
        setInstruccionesPago(config.instrucciones_pago || "");
        setPoliticas(config.politicas || "");
      })
      .catch((err) => console.error("Error cargando métodos de pago:", err));
  }, []);

  useEffect(() => {
    if (!seleccion || !comprador) navigate("/sorteos", { replace: true });
  }, [seleccion, comprador, navigate]);

  if (!seleccion || !comprador) return null;

  const { sorteo, paquete } = seleccion;

  const handleConfirmar = async () => {
    setError("");

    if (!aceptaTerminos) {
      setError("Debes aceptar los términos y condiciones para continuar.");
      return;
    }

    setProcesando(true);
    try {
      await confirmarCompra(comprobanteFile);
      navigate("/checkout/exito");
    } catch (err) {
      setError(err.message || "No se pudo procesar tu compra, intenta de nuevo.");
    } finally {
      setProcesando(false);
    }
  };

  const renderBotonPago = () => {
    if (metodoPago === "paypal") {
      return (
        <button
          className={styles.paypalBtn}
          onClick={handleConfirmar}
          disabled={procesando || !aceptaTerminos}
        >
          {procesando ? "Procesando..." : <span className={styles.paypalLogoText}>PayPal</span>}
        </button>
      );
    }

    if (metodoPago === "tarjeta") {
      return (
        <button
          className={styles.blackBtn}
          onClick={handleConfirmar}
          disabled={procesando || !aceptaTerminos}
        >
          {procesando ? (
            "Procesando..."
          ) : (
            <>
              <Icon name="card" size={18} /> Tarjeta de débito o crédito
            </>
          )}
        </button>
      );
    }

    return (
      <button
        className={styles.blackBtn}
        onClick={handleConfirmar}
        disabled={procesando || !aceptaTerminos}
      >
        {procesando ? "Procesando..." : "Pagar"}
      </button>
    );
  };

  return (
    <div className="page">
      <Navbar variant="checkout" step="pago" />

      <div className={`container ${styles.wrap}`}>
        <div className={styles.topResumenCard}>
          <h3>Tu pedido</h3>
          <div className={styles.pedidoHeaderRow}>
            <div className={styles.colHeader}>Producto</div>
            <div className={styles.colHeaderRight}>Subtotal</div>
          </div>
          <div className={styles.pedidoItemRow}>
            <div className={styles.productoText}>
              <strong>{sorteo.nombre}</strong> | Actividad
            </div>
            <div className={styles.colCantidad}>× {paquete.boletos}</div>
            <div className={styles.colSubtotal}>{formatMoney(paquete.precio)}</div>
          </div>
          <div className={styles.pedidoTotalRow}>
            <span>Total</span>
            <strong>{formatMoney(paquete.precio)}</strong>
          </div>
        </div>

        {/* Selección de Método de Pago */}
        <div className={styles.metodosSection}>
          <h2>Selecciona tu método de pago</h2>

          <div className={styles.metodosListContainer}>
            {/* Opción 1: Transferencia bancaria o depósito */}
            <div className={styles.metodoRow}>
              <label className={styles.metodoLabel} onClick={() => setMetodoPago("transferencia")}>
                <input
                  type="radio"
                  name="metodoPago"
                  checked={metodoPago === "transferencia"}
                  onChange={() => setMetodoPago("transferencia")}
                />
                <span className={styles.metodoTitulo}>Transferencia bancaria o depósito</span>
              </label>

              {metodoPago === "transferencia" && (
                <div className={styles.grayExpandBox}>
                  <p>
                    Por favor, <strong>NO PROCEDAS SI NO ESTÁS SEGURO</strong> de que quieres realizar la compra. Realiza tu pago directamente con transferencia o depósito a nuestra cuenta bancaria. Tu pedido no se procesará hasta que se haya recibido el importe en nuestra cuenta.
                  </p>
                  {instruccionesPago && (
                    <div className={styles.instruccionesText}>
                      <strong>Datos bancarios:</strong>
                      <p>{instruccionesPago}</p>
                    </div>
                  )}
                  <div className={styles.fileUploadGroup}>
                    <label>Subir comprobante de transferencia (opcional):</label>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => setComprobanteFile(e.target.files[0])}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Opción 2: Pagar con tarjetas de crédito o débito Visa o Mastercard | Payphone */}
            <div className={styles.metodoRow}>
              <label className={styles.metodoLabel} onClick={() => setMetodoPago("payphone")}>
                <input
                  type="radio"
                  name="metodoPago"
                  checked={metodoPago === "payphone"}
                  onChange={() => setMetodoPago("payphone")}
                />
                <div className={styles.metodoLabelContent}>
                  <span className={styles.metodoTitulo}>
                    Pagar con tarjetas de crédito o débito Visa o Mastercard | Payphone
                  </span>
                  <div className={styles.logosContainer}>
                    <span className={styles.visaBadge}>VISA</span>
                    <span className={styles.masterBadge} />
                    <span className={styles.discoverBadge}>DISCOVER</span>
                    <span className={styles.payphoneBadge}>payphone</span>
                  </div>
                </div>
              </label>

              {metodoPago === "payphone" && (
                <div className={styles.grayExpandBox}>
                  <p>
                    Usa tus tarjetas de crédito o débito Visa, Mastercard, Diners o Discover de cualquier banco del mundo y, si tienes la aplicación Payphone, utiliza tu saldo.
                  </p>
                  {instruccionesPago && (
                    <div className={styles.instruccionesText}>
                      <p>{instruccionesPago}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Opción 3: Pagar con tarjetas de crédito y débito Visa, Mastercard, Diners, American Express y Discover */}
            <div className={styles.metodoRow}>
              <label className={styles.metodoLabel} onClick={() => setMetodoPago("tarjeta")}>
                <input
                  type="radio"
                  name="metodoPago"
                  checked={metodoPago === "tarjeta"}
                  onChange={() => setMetodoPago("tarjeta")}
                />
                <div className={styles.metodoLabelContent}>
                  <span className={styles.metodoTitulo}>
                    Pagar con tarjetas de crédito y débito Visa, Mastercard, Diners, American Express y Discover
                  </span>
                  <div className={styles.logosContainer}>
                    <span className={styles.visaBadge}>VISA</span>
                    <span className={styles.masterBadge} />
                    <span className={styles.dinersBadge}>Diners Club</span>
                    <span className={styles.amexBadge}>AMEX</span>
                    <span className={styles.discoverBadge}>DISCOVER</span>
                  </div>
                </div>
              </label>

              {metodoPago === "tarjeta" && (
                <div className={styles.grayExpandBox}>
                  <p>Usa tus tarjetas de crédito y débito Visa, Mastercard, Diners, American Express o Discover.</p>
                </div>
              )}
            </div>

            {/* Opción 4: Pagar con PayPal */}
            <div className={styles.metodoRow}>
              <label className={styles.metodoLabel} onClick={() => setMetodoPago("paypal")}>
                <input
                  type="radio"
                  name="metodoPago"
                  checked={metodoPago === "paypal"}
                  onChange={() => setMetodoPago("paypal")}
                />
                <span className={styles.metodoTitulo}>Pagar con PayPal</span>
              </label>

              {metodoPago === "paypal" && (
                <div className={styles.grayExpandBox}>
                  <p>
                    Nuestra solución de pago todo en uno te permite ofrecer PayPal, Venmo, opciones de pago posterior y mucho más para ayudar a maximizar la conversión.
                  </p>
                </div>
              )}
            </div>
          </div>

          <p className={styles.privacyNote}>
            Tus datos personales se utilizarán para procesar tu pedido, mejorar tu experiencia en esta web y otros propósitos descritos en nuestra <strong>política de privacidad</strong>.
          </p>

          <div className={styles.termsBox}>
            <label className={styles.termsLabel}>
              <input
                type="checkbox"
                checked={aceptaTerminos}
                onChange={(e) => setAceptaTerminos(e.target.checked)}
              />
              <span>
                He leído y estoy de acuerdo con los <strong>términos y condiciones</strong> de la web *
              </span>
            </label>
          </div>

          {error && <div className={styles.errorMessage}>⚠️ {error}</div>}

          <div className={styles.actionButtonContainer}>{renderBotonPago()}</div>
        </div>
      </div>
    </div>
  );
}
