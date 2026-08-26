import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Icon from "../icons/Icon.jsx";
import { useApp } from "../context/AppContext.jsx";
import { metodosPago as todosLosMetodosPago } from "../data/sorteos.js";
import { getConfiguracion, iniciarPagoPayphone } from "../services/api.js";
import { formatMoney } from "../utils/format.js";
import styles from "./Checkout.module.css";

const PROVINCIAS_ECUADOR = [
  "Azuay",
  "Bolívar",
  "Cañar",
  "Carchi",
  "Chimborazo",
  "Cotopaxi",
  "El Oro",
  "Esmeraldas",
  "Galápagos",
  "Guayas",
  "Imbabura",
  "Loja",
  "Los Ríos",
  "Manabí",
  "Morona Santiago",
  "Napo",
  "Orellana",
  "Pastaza",
  "Pichincha",
  "Santa Elena",
  "Santo Domingo de los Tsáchilas",
  "Sucumbíos",
  "Tungurahua",
  "Zamora Chinchipe",
];

export default function Checkout() {
  const navigate = useNavigate();
  const { seleccion, comprador, setComprador, metodoPago, setMetodoPago, confirmarCompra } = useApp();

  const [form, setForm] = useState(
    comprador || {
      tipoDocumento: "cedula",
      cedula: "",
      nombres: "",
      apellidos: "",
      correo: "",
      confirmarCorreo: "",
      celular: "",
      direccion: "",
      pais: "Ecuador",
      provincia: "Azuay",
      ciudad: "",
    }
  );

  const [comprobanteFile, setComprobanteFile] = useState(null);
  const [procesando, setProcesando] = useState(false);
  const [errores, setErrores] = useState({});
  const [errorGlobal, setErrorGlobal] = useState("");
  const [instruccionesPago, setInstruccionesPago] = useState("");
  const [metodosHabilitados, setMetodosHabilitados] = useState({ transferencia: true, payphone: true, tarjeta: true });
  const [aceptaTerminos, setAceptaTerminos] = useState(false);

  useEffect(() => {
    if (!metodoPago || metodoPago === "deuna" || metodoPago === "paypal") {
      setMetodoPago("transferencia");
    }
    getConfiguracion()
      .then((config) => {
        setInstruccionesPago(config.instrucciones_pago || "");
        const metodos = config.metodosPago || {};
        setMetodosHabilitados({
          transferencia: metodos.transferencia !== false,
          payphone: metodos.payphone !== false,
          tarjeta: metodos.tarjeta !== false,
        });
      })
      .catch((err) => console.error("Error cargando configuración:", err));
  }, []);

  useEffect(() => {
    if (metodoPago && metodosHabilitados[metodoPago] === false) {
      const primerHabilitado = Object.keys(metodosHabilitados).find((k) => metodosHabilitados[k]);
      if (primerHabilitado) setMetodoPago(primerHabilitado);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metodosHabilitados]);

  useEffect(() => {
    if (!seleccion) navigate("/sorteos", { replace: true });
  }, [seleccion, navigate]);

  if (!seleccion) return null;

  const { sorteo, paquete } = seleccion;

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const validarFormulario = () => {
    const errs = {};
    if (!form.cedula.trim()) errs.cedula = "Número de cédula o documento requerido";
    if (!form.nombres.trim()) errs.nombres = "Ingresa tus nombres";
    if (!form.apellidos.trim()) errs.apellidos = "Ingresa tus apellidos";
    if (!/^\S+@\S+\.\S+$/.test(form.correo)) errs.correo = "Ingresa un correo válido";
    if (form.correo !== form.confirmarCorreo) errs.confirmarCorreo = "Los correos no coinciden";
    if (!form.celular.trim()) errs.celular = "Ingresa tu número de teléfono / celular";
    if (!form.direccion.trim()) errs.direccion = "Ingresa tu dirección de la calle";
    if (!form.ciudad.trim()) errs.ciudad = "Ingresa tu ciudad";

    setErrores(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePagar = async (e) => {
    e.preventDefault();
    setErrorGlobal("");

    if (!validarFormulario()) {
      setErrorGlobal("Por favor, completa los campos obligatorios marcados en rojo.");
      return;
    }

    if (!aceptaTerminos) {
      setErrorGlobal("Debes estar de acuerdo con los términos y condiciones de la web para continuar.");
      return;
    }

    setProcesando(true);

    const compradorFinal = {
      ...form,
      nombre: `${form.nombres.trim()} ${form.apellidos.trim()}`,
    };
    setComprador(compradorFinal);

    try {
      const compra = await confirmarCompra(comprobanteFile);

      if (metodoPago === "payphone" || metodoPago === "tarjeta") {
        // Métodos respaldados por PayPhone: se redirige a su pasarela real de pago.
        const { payWithCard } = await iniciarPagoPayphone(compra.compraId);
        window.location.href = payWithCard;
        return;
      }

      navigate("/checkout/exito");
    } catch (err) {
      setErrorGlobal(err.message || "No se pudo procesar tu pedido. Inténtalo de nuevo.");
    } finally {
      setProcesando(false);
    }
  };

  const renderBotonPago = () => {
    if (metodoPago === "tarjeta") {
      return (
        <button type="submit" className={styles.blackBtn} disabled={procesando}>
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
      <button type="submit" className={styles.blackBtn} disabled={procesando}>
        {procesando ? "Procesando..." : "Pagar"}
      </button>
    );
  };

  return (
    <div className="page">
      <Navbar variant="checkout" />

      <div className={`container ${styles.wrap}`}>
        <form onSubmit={handlePagar} noValidate className={styles.grid}>
          {/* Columna Izquierda: Datos de Facturación */}
          <div className={styles.colFacturacion}>
            <h2>Datos de Facturación</h2>

            <div className={styles.rowTwo}>
              <label className={styles.field}>
                <span>Tipo Documento *</span>
                <select value={form.tipoDocumento} onChange={handleChange("tipoDocumento")}>
                  <option value="cedula">Cédula</option>
                  <option value="pasaporte">Pasaporte</option>
                  <option value="ruc">RUC</option>
                </select>
              </label>

              <label className={styles.field}>
                <span>Número Cédula / Pasaporte *</span>
                <input
                  type="text"
                  placeholder=""
                  value={form.cedula}
                  onChange={handleChange("cedula")}
                  className={errores.cedula ? styles.inputError : ""}
                />
                {errores.cedula && <em>{errores.cedula}</em>}
              </label>
            </div>

            <div className={styles.rowTwo}>
              <label className={styles.field}>
                <span>Nombres *</span>
                <input
                  type="text"
                  placeholder="Nombre"
                  value={form.nombres}
                  onChange={handleChange("nombres")}
                  className={errores.nombres ? styles.inputError : ""}
                />
                {errores.nombres && <em>{errores.nombres}</em>}
              </label>

              <label className={styles.field}>
                <span>Apellidos *</span>
                <input
                  type="text"
                  placeholder="Apellido"
                  value={form.apellidos}
                  onChange={handleChange("apellidos")}
                  className={errores.apellidos ? styles.inputError : ""}
                />
                {errores.apellidos && <em>{errores.apellidos}</em>}
              </label>
            </div>

            <label className={styles.field}>
              <span>Correo electrónico *</span>
              <input
                type="email"
                placeholder="Email"
                value={form.correo}
                onChange={handleChange("correo")}
                className={errores.correo ? styles.inputError : ""}
              />
              {errores.correo && <em>{errores.correo}</em>}
            </label>

            <label className={styles.field}>
              <span>Confirmar correo electrónico *</span>
              <input
                type="email"
                placeholder=""
                value={form.confirmarCorreo}
                onChange={handleChange("confirmarCorreo")}
                className={errores.confirmarCorreo ? styles.inputError : ""}
              />
              {errores.confirmarCorreo && <em>{errores.confirmarCorreo}</em>}
            </label>

            <label className={styles.field}>
              <span>Teléfono *</span>
              <input
                type="tel"
                placeholder="Teléfono"
                value={form.celular}
                onChange={handleChange("celular")}
                className={errores.celular ? styles.inputError : ""}
              />
              {errores.celular && <em>{errores.celular}</em>}
            </label>

            <label className={styles.field}>
              <span>Dirección de la calle *</span>
              <input
                type="text"
                placeholder="Dirección"
                value={form.direccion}
                onChange={handleChange("direccion")}
                className={errores.direccion ? styles.inputError : ""}
              />
              {errores.direccion && <em>{errores.direccion}</em>}
            </label>

            <label className={styles.field}>
              <span>País / Región *</span>
              <input type="text" value={form.pais} readOnly className={styles.readOnlyInput} />
            </label>

            <div className={styles.rowTwo}>
              <label className={styles.field}>
                <span>Provincia *</span>
                <select value={form.provincia} onChange={handleChange("provincia")}>
                  {PROVINCIAS_ECUADOR.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </label>

              <label className={styles.field}>
                <span>Ciudad *</span>
                <input
                  type="text"
                  placeholder="Ciudad"
                  value={form.ciudad}
                  onChange={handleChange("ciudad")}
                  className={errores.ciudad ? styles.inputError : ""}
                />
                {errores.ciudad && <em>{errores.ciudad}</em>}
              </label>
            </div>
          </div>

          {/* Columna Derecha: Tu Pedido + Selección de Método de Pago */}
          <div className={styles.colPedidoPago}>
            {/* Sección Tu Pedido */}
            <div className={styles.tuPedidoBox}>
              <h3>Tu pedido</h3>
              <div className={styles.pedidoTableHeader}>
                <span>Producto</span>
                <span className={styles.rightAlign}>Subtotal</span>
              </div>
              <div className={styles.pedidoTableBody}>
                <div className={styles.productoText}>
                  <strong>{sorteo.nombre}</strong> | Actividad #{sorteo.id}
                </div>
                <div className={styles.colMult}>× {paquete.boletos}</div>
                <div className={styles.colPrice}>{formatMoney(paquete.precio)}</div>
              </div>
              <div className={styles.pedidoTableTotal}>
                <span>Total</span>
                <strong>{formatMoney(paquete.precio)}</strong>
              </div>
            </div>

            {/* Sección Selecciona tu método de pago */}
            <div className={styles.metodosBox}>
              <h3>Selecciona tu método de pago</h3>

              <div className={styles.metodosList}>
                {/* Opción 1: Transferencia bancaria o depósito */}
                {metodosHabilitados.transferencia && (
                <div className={styles.metodoItem}>
                  <label className={styles.radioLabel} onClick={() => setMetodoPago("transferencia")}>
                    <input
                      type="radio"
                      name="metodo"
                      checked={metodoPago === "transferencia"}
                      onChange={() => setMetodoPago("transferencia")}
                    />
                    <span className={styles.radioText}>Transferencia bancaria o depósito</span>
                  </label>

                  {metodoPago === "transferencia" && (
                    <div className={styles.expandGrayBox}>
                      <p>
                        Por favor, <strong>NO PROCEDAS SI NO ESTÁS SEGURO</strong> de que quieres realizar la compra. Realiza tu pago directamente con transferencia o depósito a nuestra cuenta bancaria. Tu pedido no se procesará hasta que se haya recibido el importe en nuestra cuenta.
                      </p>
                      {instruccionesPago && (
                        <p style={{ whiteSpace: "pre-line", marginTop: "10px" }}>{instruccionesPago}</p>
                      )}
                    </div>
                  )}
                </div>
                )}

                {/* Opción 2: Pagar con tarjetas de crédito o débito Visa o Mastercard | Payphone */}
                {metodosHabilitados.payphone && (
                <div className={styles.metodoItem}>
                  <label className={styles.radioLabel} onClick={() => setMetodoPago("payphone")}>
                    <input
                      type="radio"
                      name="metodo"
                      checked={metodoPago === "payphone"}
                      onChange={() => setMetodoPago("payphone")}
                    />
                    <div className={styles.radioTextContent}>
                      <span className={styles.radioText}>
                        Pagar con tarjetas de crédito o débito Visa o Mastercard | Payphone
                      </span>
                      <div className={styles.badgesRow}>
                        <span className={styles.visaBadge}>VISA</span>
                        <span className={styles.masterBadge} />
                        <span className={styles.discoverBadge}>DISCOVER</span>
                        <span className={styles.payphoneBadge}>payphone</span>
                      </div>
                    </div>
                  </label>

                  {metodoPago === "payphone" && (
                    <div className={styles.expandGrayBox}>
                      <p>
                        Usa tus tarjetas de crédito o débito Visa, Mastercard, Diners o Discover de cualquier banco del mundo y, si tienes la aplicación Payphone, utiliza tu saldo.
                      </p>
                    </div>
                  )}
                </div>
                )}

                {/* Opción 3: Pagar con tarjetas de crédito y débito Visa, Mastercard, Diners, American Express y Discover */}
                {metodosHabilitados.tarjeta && (
                <div className={styles.metodoItem}>
                  <label className={styles.radioLabel} onClick={() => setMetodoPago("tarjeta")}>
                    <input
                      type="radio"
                      name="metodo"
                      checked={metodoPago === "tarjeta"}
                      onChange={() => setMetodoPago("tarjeta")}
                    />
                    <div className={styles.radioTextContent}>
                      <span className={styles.radioText}>
                        Pagar con tarjetas de crédito y débito Visa, Mastercard, Diners, American Express y Discover
                      </span>
                      <div className={styles.badgesRow}>
                        <span className={styles.visaBadge}>VISA</span>
                        <span className={styles.masterBadge} />
                        <span className={styles.dinersBadge}>Diners Club</span>
                        <span className={styles.amexBadge}>AMEX</span>
                        <span className={styles.discoverBadge}>DISCOVER</span>
                      </div>
                    </div>
                  </label>

                  {metodoPago === "tarjeta" && (
                    <div className={styles.expandGrayBox}>
                      <p>Usa tus tarjetas de crédito y débito Visa, Mastercard, Diners, American Express o Discover.</p>
                    </div>
                  )}
                </div>
                )}

              </div>

              <p className={styles.privacyNote}>
                Tus datos personales se utilizarán para procesar tu pedido, mejorar tu experiencia en esta web y otros propósitos descritos en nuestra <strong>política de privacidad</strong>.
              </p>

              <div className={styles.termsRow}>
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

              {errorGlobal && <div className={styles.errorMessage}>⚠️ {errorGlobal}</div>}

              <div className={styles.btnRow}>{renderBotonPago()}</div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
