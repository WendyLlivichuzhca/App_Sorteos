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

const brandChip = (icon) => {
  switch (icon) {
    case "card":
    case "payphone":
      return (
        <span className={styles.brandChip}>
          <span className={styles.visa}>VISA</span>
          <span className={styles.mastercard} />
          <span className={styles.payphoneBadge}>PayPhone</span>
        </span>
      );
    case "qr":
      return <Icon name="qr" size={24} strokeWidth={1.5} className={styles.brandIcon} />;
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
  const [comprobanteFile, setComprobanteFile] = useState(null);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");
  const [metodosPago, setMetodosPago] = useState(todosLosMetodosPago);
  const [instruccionesPago, setInstruccionesPago] = useState("");
  const [politicas, setPoliticas] = useState("");
  const [aceptaTerminos, setAceptaTerminos] = useState(false);

  useEffect(() => {
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

  return (
    <div className="page">
      <Navbar variant="checkout" step="pago" />

      <div className={`container ${styles.wrap}`}>
        <Link to="/checkout/datos" className={styles.volver}>
          <Icon name="chevronLeft" size={16} /> Volver a datos personales
        </Link>

        <div className={styles.grid}>
          {/* Columna Izquierda: Selección de Métodos de Pago */}
          <div className={styles.metodos}>
            <h1>Selecciona tu método de pago</h1>
            <p className={styles.subtitle}>Elige cómo deseas realizar tu pago de manera rápida y segura.</p>

            <div className={styles.lista}>
              {metodosPago.map((m) => {
                const esActivo = metodoPago === m.id;
                return (
                  <div key={m.id} className={styles.metodoBox}>
                    <button
                      type="button"
                      className={`${styles.metodo} ${esActivo ? styles.metodoActivo : ""}`}
                      onClick={() => setMetodoPago(m.id)}
                    >
                      <span className={styles.radio}>
                        {esActivo && <span className={styles.radioDot} />}
                      </span>
                      <span className={styles.metodoInfo}>
                        <strong>{m.nombre}</strong>
                        <span>{m.detalle}</span>
                      </span>
                      {brandChip(m.icon)}
                    </button>

                    {/* Detalle desplegable según el método seleccionado */}
                    {esActivo && (
                      <div className={styles.metodoDetalleBox}>
                        {m.id === "transferencia" && (
                          <div className={styles.transferenciaAlert}>
                            <div className={styles.alertNotice}>
                              <Icon name="alertTriangle" size={18} />
                              <span>
                                Por favor, <strong>NO PROCEDAS SI NO ESTÁS SEGURO</strong> de que quieres realizar la compra. Realiza tu pago directamente con transferencia o depósito a nuestra cuenta bancaria. Tu pedido no se procesará hasta que se haya verificado el importe en nuestra cuenta.
                              </span>
                            </div>

                            {instruccionesPago && (
                              <div className={styles.instruccionesText}>
                                <strong>Datos de la Cuenta Bancaria:</strong>
                                <p>{instruccionesPago}</p>
                              </div>
                            )}

                            <div className={styles.uploadBox}>
                              <label>Subir comprobante de transferencia (Imagen o PDF):</label>
                              <input
                                type="file"
                                accept="image/*,application/pdf"
                                onChange={(e) => setComprobanteFile(e.target.files[0])}
                              />
                            </div>
                          </div>
                        )}

                        {m.id === "payphone" && (
                          <div className={styles.payphoneAlert}>
                            <p>
                              Paga de forma instantánea con cualquier tarjeta de crédito o débito (Visa / Mastercard / Discover) o desde la app oficial de <strong>PayPhone</strong>.
                            </p>
                            {instruccionesPago && (
                              <div className={styles.instruccionesText}>
                                <p>{instruccionesPago}</p>
                              </div>
                            )}
                            <div className={styles.uploadBox}>
                              <label>Subir comprobante de pago de Payphone (opcional):</label>
                              <input
                                type="file"
                                accept="image/*,application/pdf"
                                onChange={(e) => setComprobanteFile(e.target.files[0])}
                              />
                            </div>
                          </div>
                        )}

                        {m.id === "tarjeta" && (
                          <div className={styles.tarjetaAlert}>
                            <p>Procesamiento directo de tarjeta de crédito/débito nacional o internacional.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Checkbox de Términos y Condiciones */}
            <div className={styles.termsBox}>
              <label className={styles.termsLabel}>
                <input
                  type="checkbox"
                  checked={aceptaTerminos}
                  onChange={(e) => setAceptaTerminos(e.target.checked)}
                />
                <span>
                  He leído y estoy de acuerdo con los <strong>términos y condiciones</strong> de la web y la política de sorteos. *
                </span>
              </label>
            </div>

            {error && <div className={styles.errorMessage}>⚠️ {error}</div>}

            <button
              className={`btn btn-primary btn-block ${styles.pagarMainBtn}`}
              onClick={handleConfirmar}
              disabled={procesando || !aceptaTerminos}
            >
              {procesando ? (
                "Procesando pago..."
              ) : (
                <>
                  Pagar {formatMoney(paquete.precio)} <Icon name="lock" size={17} />
                </>
              )}
            </button>
          </div>

          {/* Columna Derecha: Resumen de Pedido y Datos del Comprador */}
          <div className={styles.resumenCol}>
            <div className={styles.resumenCard}>
              <h3>Tu Pedido</h3>

              <div className={styles.sorteoRow}>
                <div className={styles.sorteoImg}>
                  <PremioImage categoria={sorteo.categoria} src={sorteo.imagenUrl} iconSize={26} />
                </div>
                <div className={styles.sorteoText}>
                  <h4>{sorteo.nombre}</h4>
                  <span>
                    {paquete.boletos} {paquete.boletos === 1 ? "Boleto" : "Boletos"} × {formatMoney(sorteo.precio)}
                  </span>
                </div>
                <strong className={styles.sorteoTotal}>{formatMoney(paquete.precio)}</strong>
              </div>

              <div className={styles.compradorResumen}>
                <h5>Datos del Comprador:</h5>
                <div className={styles.compradorLine}>
                  <span>Nombre:</span> <strong>{comprador.nombre}</strong>
                </div>
                <div className={styles.compradorLine}>
                  <span>Cédula:</span> <strong>{comprador.cedula}</strong>
                </div>
                <div className={styles.compradorLine}>
                  <span>Correo:</span> <strong>{comprador.correo}</strong>
                </div>
                <div className={styles.compradorLine}>
                  <span>Celular:</span> <strong>{comprador.celular}</strong>
                </div>
                {comprador.ciudad && (
                  <div className={styles.compradorLine}>
                    <span>Ciudad:</span> <strong>{comprador.ciudad}, {comprador.provincia}</strong>
                  </div>
                )}
              </div>

              <div className={styles.totalBox}>
                <div className={styles.subtotalRow}>
                  <span>Subtotal</span>
                  <strong>{formatMoney(paquete.precio)}</strong>
                </div>
                <div className={styles.finalTotalRow}>
                  <span>Total a pagar</span>
                  <strong>{formatMoney(paquete.precio)}</strong>
                </div>
              </div>

              <div className={styles.seguridadBox}>
                <div className={styles.seguridadItem}>
                  <Icon name="shield" size={15} /> <span>Pago 100% Garantizado</span>
                </div>
                <div className={styles.seguridadItem}>
                  <Icon name="lock" size={15} /> <span>Encriptación SSL 256-bit</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
