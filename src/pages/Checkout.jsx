import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import Icon from "../icons/Icon.jsx";
import { useApp } from "../context/AppContext.jsx";
import { metodosPago as todosLosMetodosPago } from "../data/sorteos.js";
import { paises } from "../data/paises.js";
import { getConfiguracion, iniciarPagoPayphone } from "../services/api.js";
import { formatMoney } from "../utils/format.js";
import { validarDocumento } from "../utils/validarDocumento.js";
import { validarNombre, limpiarNombre } from "../utils/validarNombre.js";
import { validarCorreo } from "../utils/validarCorreo.js";
import "react-phone-number-input/style.css";
import styles from "./Checkout.module.css";

const DOCUMENTO_INFO = {
  cedula: { etiqueta: "Número de Cédula", placeholder: "10 dígitos", maxLength: 10 },
  ruc: { etiqueta: "Número de RUC", placeholder: "13 dígitos", maxLength: 13 },
  pasaporte: { etiqueta: "Número de Pasaporte", placeholder: "", maxLength: 15 },
};

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

  const [paso, setPaso] = useState(1);
  const [comprobanteFile, setComprobanteFile] = useState(null);
  const [procesando, setProcesando] = useState(false);
  const [errores, setErrores] = useState({});
  const [tocados, setTocados] = useState({
    cedula: false,
    nombres: false,
    apellidos: false,
    correo: false,
    confirmarCorreo: false,
    celular: false,
  });
  const [errorGlobal, setErrorGlobal] = useState("");
  const [instruccionesPago, setInstruccionesPago] = useState("");
  const [cuentasBancarias, setCuentasBancarias] = useState([]);
  const [qrPago, setQrPago] = useState("");
  const [qrPagos, setQrPagos] = useState([]);
  const [metodosHabilitados, setMetodosHabilitados] = useState({ transferencia: true, payphone: true, qr: false });
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [provinciasExtranjero, setProvinciasExtranjero] = useState([]);
  const [telefonoLib, setTelefonoLib] = useState(null);

  useEffect(() => {
    let activo = true;
    Promise.all([
      import("react-phone-number-input"),
      import("react-phone-number-input/locale/es.json"),
    ]).then(([mod, esLabels]) => {
      if (activo) {
        setTelefonoLib({
          PhoneInput: mod.default,
          isValidPhoneNumber: mod.isValidPhoneNumber,
          labels: esLabels.default || esLabels,
        });
      }
    });
    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    if (form.pais === "Ecuador") {
      setProvinciasExtranjero([]);
      return;
    }
    const paisSeleccionado = paises.find((p) => p.nombre === form.pais);
    if (!paisSeleccionado || !paisSeleccionado.isoCode) {
      setProvinciasExtranjero([]);
      return;
    }
    let cancelado = false;
    import("country-state-city").then(({ State }) => {
      if (cancelado) return;
      setProvinciasExtranjero(State.getStatesOfCountry(paisSeleccionado.isoCode));
    });
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.pais]);

  useEffect(() => {
    if (!metodoPago || metodoPago === "deuna" || metodoPago === "paypal" || metodoPago === "tarjeta") {
      setMetodoPago("transferencia");
    }
    getConfiguracion()
      .then((config) => {
        setInstruccionesPago(config.instrucciones_pago || "");
        setCuentasBancarias(config.cuentasBancarias || []);
        setQrPago(config.qr_pago || "");
        setQrPagos(config.qrPagos || []);
        const metodos = config.metodosPago || {};
        setMetodosHabilitados({
          transferencia: metodos.transferencia !== false,
          payphone: metodos.payphone !== false,
          qr: Boolean(metodos.qr && config.qr_pago),
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
  const handleChangeDocumento = (e) => {
    const crudo = e.target.value;
    const limpio =
      form.tipoDocumento === "pasaporte"
        ? crudo.replace(/[^A-Za-z0-9]/g, "")
        : crudo.replace(/\D/g, "");
    setForm((f) => ({ ...f, cedula: limpio }));
  };
  const handleChangeNombre = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: limpiarNombre(e.target.value) }));
  const handleChangeCelular = (value) =>
    setForm((f) => ({ ...f, celular: value || "" }));

  const validarCampoVivo = (field, valor) => {
    if (field === "cedula") {
      const doc = validarDocumento(form.tipoDocumento, valor);
      return doc.valido ? "" : doc.mensaje;
    }
    if (field === "nombres") {
      return validarNombre(valor) ? "" : "Ingresa un nombre válido (solo letras, mínimo 2 caracteres)";
    }
    if (field === "apellidos") {
      return validarNombre(valor) ? "" : "Ingresa un apellido válido (solo letras, mínimo 2 caracteres)";
    }
    if (field === "correo") {
      const c = validarCorreo(valor);
      return c.valido ? "" : c.mensaje;
    }
    if (field === "confirmarCorreo") {
      return valor === form.correo ? "" : "Los correos no coinciden";
    }
    if (field === "celular") {
      if (!valor) return "Ingresa tu número de teléfono";
      if (telefonoLib && !telefonoLib.isValidPhoneNumber(valor)) {
        return "Ingresa un número de teléfono válido";
      }
      return "";
    }
    return "";
  };

  const handleBlurVivo = (field) => () => {
    setTocados((t) => ({ ...t, [field]: true }));
    setErrores((e) => ({ ...e, [field]: validarCampoVivo(field, form[field]) }));
  };

  const esCampoValido = (field) =>
    tocados[field] && !errores[field] && String(form[field] || "").trim() !== "";

  const validarDatos = () => {
    const errs = {};
    errs.cedula = validarCampoVivo("cedula", form.cedula);
    errs.nombres = validarCampoVivo("nombres", form.nombres);
    errs.apellidos = validarCampoVivo("apellidos", form.apellidos);
    errs.correo = validarCampoVivo("correo", form.correo);
    errs.confirmarCorreo = validarCampoVivo("confirmarCorreo", form.confirmarCorreo);
    errs.celular = validarCampoVivo("celular", form.celular);
    if (!form.direccion.trim()) errs.direccion = "Ingresa tu dirección de la calle";
    if (!form.ciudad.trim()) errs.ciudad = "Ingresa tu ciudad";
    if (form.pais !== "Ecuador" && !form.provincia.trim()) errs.provincia = "Ingresa tu provincia, estado o región";

    Object.keys(errs).forEach((k) => !errs[k] && delete errs[k]);
    setErrores(errs);
    setTocados((t) => ({
      ...t,
      cedula: true,
      nombres: true,
      apellidos: true,
      correo: true,
      confirmarCorreo: true,
      celular: true,
    }));
    return Object.keys(errs).length === 0;
  };

  const handleContinuar = (e) => {
    e.preventDefault();
    setErrorGlobal("");
    if (!validarDatos()) {
      setErrorGlobal("Por favor, completa los campos obligatorios marcados en rojo.");
      return;
    }
    // Se guarda ya mismo (no solo al final de la compra) para que, si el
    // cliente usa el botón "atrás" del navegador o recarga por accidente,
    // no pierda lo que ya llenó.
    setComprador(form);
    setPaso(2);
  };

  const handlePagar = async (e) => {
    e.preventDefault();
    setErrorGlobal("");

    if ((metodoPago === "transferencia" || metodoPago === "qr") && !comprobanteFile) {
      setErrores((er) => ({ ...er, comprobante: "Sube una foto o PDF de tu comprobante de pago para continuar" }));
      setErrorGlobal("Por favor, sube tu comprobante de pago para continuar.");
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

    try {
      const compra = await confirmarCompra(compradorFinal, comprobanteFile);

      if (metodoPago === "payphone") {
        // Método respaldado por PayPhone: se redirige a su pasarela real de pago.
        const { payWithCard } = await iniciarPagoPayphone(compra.compraId);
        if (!payWithCard) {
          setErrorGlobal(
            "No se pudo conectar con la pasarela de pago con tarjeta en este momento. Tu pedido quedó guardado (código " +
              compra.codigo +
              "), pero inténtalo de nuevo en unos minutos o elige otro método de pago."
          );
          setProcesando(false);
          return;
        }
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
    if (metodoPago === "payphone") {
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
        {procesando ? (
          "Procesando..."
        ) : (
          <>
            <Icon name="lock" size={16} /> Pagar <Icon name="arrowRight" size={16} />
          </>
        )}
      </button>
    );
  };

  return (
    <div className="page">
      <Navbar variant="checkout" step={paso === 1 ? "datos" : "pago"} />

      <div className={styles.decorWrap}>
        <div className={`${styles.blob} ${styles.blob1}`} />
        <div className={`${styles.blob} ${styles.blob2}`} />
        <svg className={`${styles.leaf} ${styles.leaf1}`} viewBox="0 0 100 100" fill="none" aria-hidden="true"><path fill="currentColor" d="M50 5C25 15 10 40 15 65C20 88 45 98 68 90C88 83 95 60 85 40C75 20 60 8 50 5Z" /></svg>
        <svg className={`${styles.leaf} ${styles.leaf2}`} viewBox="0 0 100 100" fill="none" aria-hidden="true"><path fill="currentColor" d="M50 5C25 15 10 40 15 65C20 88 45 98 68 90C88 83 95 60 85 40C75 20 60 8 50 5Z" /></svg>
        <svg className={`${styles.leaf} ${styles.leaf3}`} viewBox="0 0 100 100" fill="none" aria-hidden="true"><path fill="currentColor" d="M50 5C25 15 10 40 15 65C20 88 45 98 68 90C88 83 95 60 85 40C75 20 60 8 50 5Z" /></svg>
        <svg className={`${styles.leaf} ${styles.leaf4}`} viewBox="0 0 100 100" fill="none" aria-hidden="true"><path fill="currentColor" d="M50 5C25 15 10 40 15 65C20 88 45 98 68 90C88 83 95 60 85 40C75 20 60 8 50 5Z" /></svg>

      <div className={`container ${styles.wrap}`}>
        <form onSubmit={paso === 1 ? handleContinuar : handlePagar} noValidate className={styles.grid}>
          {/* Columna Izquierda: Datos de Facturación */}
          <div className={styles.colFacturacion}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}><Icon name="id" size={18} /></span>
              Datos de Facturación
            </h2>

            {paso === 2 && (
              <div className={styles.cardBox}>
                <div className={styles.cardBoxHeader}>
                  <h3 className={styles.sectionTitleSm}>
                    <span className={styles.sectionIcon}><Icon name="id" size={15} /></span>
                    Tus datos
                  </h3>
                  <button type="button" className={styles.editLink} onClick={() => setPaso(1)}>
                    ✏️ Editar
                  </button>
                </div>
                <div className={styles.datosRow}>
                  <span>Nombre</span>
                  <strong>{form.nombres} {form.apellidos}</strong>
                </div>
                <div className={styles.datosRow}>
                  <span>{DOCUMENTO_INFO[form.tipoDocumento].etiqueta}</span>
                  <strong>{form.cedula}</strong>
                </div>
                <div className={styles.datosRow}>
                  <span>Correo</span>
                  <strong>{form.correo}</strong>
                </div>
                <div className={styles.datosRow}>
                  <span>Teléfono</span>
                  <strong>{form.celular}</strong>
                </div>
                <div className={styles.datosRow}>
                  <span>Dirección</span>
                  <strong>{form.direccion}, {form.ciudad}, {form.provincia}</strong>
                </div>
              </div>
            )}

            {paso === 2 && metodoPago === "transferencia" && (
              <div className={styles.cardBox} style={{ marginTop: "20px" }}>
                <div className={styles.cardBoxHeader}>
                  <h3 className={styles.sectionTitleSm}>
                    <span className={styles.sectionIcon}><Icon name="bank" size={15} /></span>
                    Cuentas para tu transferencia
                  </h3>
                </div>
                {cuentasBancarias.length > 0 ? (
                  cuentasBancarias.map((c, idx) => (
                    <div key={idx} className={styles.cuentaCard}>
                      <div className={styles.cuentaBanco}>{c.banco || "Cuenta bancaria"}</div>
                      {c.tipoCuenta && (
                        <div className={styles.cuentaRow}><span>Tipo</span><strong>{c.tipoCuenta}</strong></div>
                      )}
                      {c.numeroCuenta && (
                        <div className={styles.cuentaRow}><span>Número</span><strong>{c.numeroCuenta}</strong></div>
                      )}
                      {c.titular && (
                        <div className={styles.cuentaRow}><span>Titular</span><strong>{c.titular}</strong></div>
                      )}
                      {c.cedulaTitular && (
                        <div className={styles.cuentaRow}><span>Cédula/RUC</span><strong>{c.cedulaTitular}</strong></div>
                      )}
                    </div>
                  ))
                ) : instruccionesPago ? (
                  <p style={{ fontSize: "13px", color: "#3F4A44", whiteSpace: "pre-line" }}>{instruccionesPago}</p>
                ) : (
                  <p style={{ fontSize: "13px", color: "#8B958F" }}>
                    Por favor contáctanos para que te enviemos los datos de la cuenta para tu transferencia.
                  </p>
                )}
              </div>
            )}

            {paso === 2 && metodoPago === "qr" && (
              <div className={styles.cardBox} style={{ marginTop: "20px" }}>
                <div className={styles.cardBoxHeader}>
                  <h3 className={styles.sectionTitleSm}>
                    <span className={styles.sectionIcon}><Icon name="qr" size={15} /></span>
                    Códigos QR para pagar
                  </h3>
                </div>
                {qrPagos.length > 0 ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "14px" }}>
                    {qrPagos.map((q, idx) => (
                      <div key={idx} className={styles.cuentaCard} style={{ textAlign: "center" }}>
                        {q.imagen && (
                          <img
                            src={q.imagen}
                            alt={q.etiqueta || "Código QR"}
                            style={{ width: "130px", height: "130px", objectFit: "contain", borderRadius: "8px", background: "#fff" }}
                          />
                        )}
                        <div className={styles.cuentaBanco} style={{ marginTop: "8px" }}>{q.etiqueta || "Código QR"}</div>
                      </div>
                    ))}
                  </div>
                ) : qrPago ? (
                  <img
                    src={qrPago}
                    alt="Código QR para pagar"
                    style={{ width: "150px", height: "150px", objectFit: "contain", border: "1px solid #E3E8E5", borderRadius: "8px", background: "#fff" }}
                  />
                ) : (
                  <p style={{ fontSize: "13px", color: "#8B958F" }}>
                    Por favor contáctanos para que te enviemos el código QR para tu pago.
                  </p>
                )}
              </div>
            )}

            {paso === 1 && (
            <>
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
                <span>{DOCUMENTO_INFO[form.tipoDocumento].etiqueta} *</span>
                <div className={styles.inputIconWrap}>
                  <input
                    type="text"
                    placeholder={DOCUMENTO_INFO[form.tipoDocumento].placeholder}
                    maxLength={DOCUMENTO_INFO[form.tipoDocumento].maxLength}
                    value={form.cedula}
                    onChange={handleChangeDocumento}
                    onBlur={handleBlurVivo("cedula")}
                    className={
                      tocados.cedula && errores.cedula
                        ? styles.inputError
                        : esCampoValido("cedula")
                        ? styles.inputValid
                        : ""
                    }
                  />
                  {tocados.cedula && errores.cedula && <Icon name="x" size={16} className={styles.iconInvalid} />}
                  {esCampoValido("cedula") && <Icon name="check" size={16} className={styles.iconValid} />}
                </div>
                {tocados.cedula && errores.cedula && <em>{errores.cedula}</em>}
                {esCampoValido("cedula") && <em className={styles.textoValido}>¡Correcto!</em>}
              </label>
            </div>

            <div className={styles.rowTwo}>
              <label className={styles.field}>
                <span>Nombres *</span>
                <div className={styles.inputIconWrap}>
                  <input
                    type="text"
                    placeholder="Nombre"
                    value={form.nombres}
                    onChange={handleChangeNombre("nombres")}
                    onBlur={handleBlurVivo("nombres")}
                    className={
                      tocados.nombres && errores.nombres
                        ? styles.inputError
                        : esCampoValido("nombres")
                        ? styles.inputValid
                        : ""
                    }
                  />
                  {tocados.nombres && errores.nombres && <Icon name="x" size={16} className={styles.iconInvalid} />}
                  {esCampoValido("nombres") && <Icon name="check" size={16} className={styles.iconValid} />}
                </div>
                {tocados.nombres && errores.nombres && <em>{errores.nombres}</em>}
                {esCampoValido("nombres") && <em className={styles.textoValido}>¡Correcto!</em>}
              </label>

              <label className={styles.field}>
                <span>Apellidos *</span>
                <div className={styles.inputIconWrap}>
                  <input
                    type="text"
                    placeholder="Apellido"
                    value={form.apellidos}
                    onChange={handleChangeNombre("apellidos")}
                    onBlur={handleBlurVivo("apellidos")}
                    className={
                      tocados.apellidos && errores.apellidos
                        ? styles.inputError
                        : esCampoValido("apellidos")
                        ? styles.inputValid
                        : ""
                    }
                  />
                  {tocados.apellidos && errores.apellidos && <Icon name="x" size={16} className={styles.iconInvalid} />}
                  {esCampoValido("apellidos") && <Icon name="check" size={16} className={styles.iconValid} />}
                </div>
                {tocados.apellidos && errores.apellidos && <em>{errores.apellidos}</em>}
                {esCampoValido("apellidos") && <em className={styles.textoValido}>¡Correcto!</em>}
              </label>
            </div>

            <label className={styles.field}>
              <span>Correo electrónico *</span>
              <div className={styles.inputIconWrap}>
                <input
                  type="email"
                  placeholder="Email"
                  value={form.correo}
                  onChange={handleChange("correo")}
                  onBlur={handleBlurVivo("correo")}
                  className={
                    tocados.correo && errores.correo
                      ? styles.inputError
                      : esCampoValido("correo")
                      ? styles.inputValid
                      : ""
                  }
                />
                {tocados.correo && errores.correo && <Icon name="x" size={16} className={styles.iconInvalid} />}
                {esCampoValido("correo") && <Icon name="check" size={16} className={styles.iconValid} />}
              </div>
              {tocados.correo && errores.correo && <em>{errores.correo}</em>}
              {esCampoValido("correo") && <em className={styles.textoValido}>¡Correcto!</em>}
            </label>

            <label className={styles.field}>
              <span>Confirmar correo electrónico *</span>
              <div className={styles.inputIconWrap}>
                <input
                  type="email"
                  placeholder=""
                  value={form.confirmarCorreo}
                  onChange={handleChange("confirmarCorreo")}
                  onBlur={handleBlurVivo("confirmarCorreo")}
                  className={
                    tocados.confirmarCorreo && errores.confirmarCorreo
                      ? styles.inputError
                      : esCampoValido("confirmarCorreo")
                      ? styles.inputValid
                      : ""
                  }
                />
                {tocados.confirmarCorreo && errores.confirmarCorreo && (
                  <Icon name="x" size={16} className={styles.iconInvalid} />
                )}
                {esCampoValido("confirmarCorreo") && <Icon name="check" size={16} className={styles.iconValid} />}
              </div>
              {tocados.confirmarCorreo && errores.confirmarCorreo && <em>{errores.confirmarCorreo}</em>}
              {esCampoValido("confirmarCorreo") && <em className={styles.textoValido}>¡Correcto!</em>}
            </label>

            <label className={styles.field}>
              <span>Teléfono *</span>
              {telefonoLib ? (
                <telefonoLib.PhoneInput
                  international
                  defaultCountry="EC"
                  labels={telefonoLib.labels}
                  value={form.celular}
                  onChange={handleChangeCelular}
                  onBlur={handleBlurVivo("celular")}
                  className={
                    tocados.celular && errores.celular
                      ? styles.phoneInputError
                      : esCampoValido("celular")
                      ? styles.phoneInputValid
                      : styles.phoneInput
                  }
                />
              ) : (
                <input type="tel" disabled placeholder="Cargando..." />
              )}
              {tocados.celular && errores.celular && <em>{errores.celular}</em>}
              {esCampoValido("celular") && <em className={styles.textoValido}>¡Correcto!</em>}
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
              <select
                value={form.pais}
                onChange={(e) => {
                  const nuevoPais = e.target.value;
                  setForm((f) => ({
                    ...f,
                    pais: nuevoPais,
                    provincia: nuevoPais === "Ecuador" ? PROVINCIAS_ECUADOR[0] : "",
                  }));
                }}
              >
                {paises.map((p) => (
                  <option key={p.nombre} value={p.nombre}>{p.nombre}</option>
                ))}
              </select>
            </label>

            <div className={styles.rowTwo}>
              <label className={styles.field}>
                <span>{form.pais === "Ecuador" ? "Provincia *" : "Provincia / Estado *"}</span>
                {form.pais === "Ecuador" ? (
                  <select value={form.provincia} onChange={handleChange("provincia")}>
                    {PROVINCIAS_ECUADOR.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                ) : provinciasExtranjero.length > 0 ? (
                  <select value={form.provincia} onChange={handleChange("provincia")}>
                    <option value="">Selecciona...</option>
                    {provinciasExtranjero.map((p) => (
                      <option key={p.isoCode} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="Provincia, estado o región"
                    value={form.provincia}
                    onChange={handleChange("provincia")}
                    className={errores.provincia ? styles.inputError : ""}
                  />
                )}
                {errores.provincia && <em>{errores.provincia}</em>}
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
            </>
            )}
          </div>

          {/* Columna Derecha: Tu Pedido + Selección de Método de Pago */}
          <div className={styles.colPedidoPago}>
            {/* Sección Tu Pedido */}
            <div className={styles.tuPedidoBox}>
              <h3 className={styles.sectionTitle}>
                <span className={styles.sectionIcon}><Icon name="cart" size={18} /></span>
                Tu pedido
              </h3>
              <div className={styles.productoCard}>
                <span className={styles.productoIcon}>
                  <Icon name="ticket" size={18} />
                </span>
                <div className={styles.productoInfo}>
                  <strong>{sorteo.nombre}</strong>
                  <span className={styles.productoMeta}>Sorteo #{sorteo.id} · × {paquete.boletos} boletos</span>
                </div>
                <div className={styles.colPrice}>{formatMoney(paquete.precio)}</div>
              </div>
              <div className={styles.pedidoTableTotal}>
                <span>Total</span>
                <strong>{formatMoney(paquete.precio)}</strong>
              </div>
            </div>

            {/* Sección Selecciona tu método de pago */}
            <div className={styles.metodosBox}>
              <div className={styles.cardBoxHeader}>
                <h3>{paso === 1 ? "Selecciona tu método de pago" : "Completa tu pago"}</h3>
                {paso === 2 && (
                  <button type="button" className={styles.changeMethodBtn} onClick={() => setPaso(1)}>
                    ↩️ Cambiar método de pago
                  </button>
                )}
              </div>

              <div className={styles.metodosList}>
                {/* Opción 1: Transferencia bancaria o depósito */}
                {metodosHabilitados.transferencia && (
                <div className={styles.metodoItem}>
                  {paso === 1 && (
                  <label className={styles.radioLabel} onClick={() => setMetodoPago("transferencia")}>
                    <input
                      type="radio"
                      name="metodo"
                      checked={metodoPago === "transferencia"}
                      onChange={() => setMetodoPago("transferencia")}
                    />
                    <span className={styles.radioText}><Icon name="bank" size={16} className={styles.radioIcon} /> Transferencia bancaria o depósito</span>
                  </label>
                  )}

                  {paso === 2 && metodoPago === "transferencia" && (
                    <div className={styles.expandGrayBox}>
                      <div className={styles.avisoBox}>
                        <span className={styles.avisoIcon}><Icon name="shield" size={16} /></span>
                        <p>
                          Por favor, <strong>NO PROCEDAS SI NO ESTÁS SEGURO</strong> de que quieres realizar la compra. Tu pedido no se procesará hasta que se haya recibido el importe en nuestra cuenta.
                        </p>
                      </div>
                      <span className={styles.fileUploadLabelText}>Sube tu comprobante de pago *</span>
                      <label className={styles.fileUploadRow}>
                        <span className={styles.fileUploadBtn}>
                          <Icon name="upload" size={15} /> Seleccionar archivo
                        </span>
                        <span className={styles.fileUploadName}>
                          {comprobanteFile ? comprobanteFile.name : "Ningún archivo seleccionado"}
                        </span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) => setComprobanteFile(e.target.files[0] || null)}
                          className={styles.fileUploadInput}
                        />
                      </label>
                      {comprobanteFile && (
                        <p className={styles.fileUploadOk}>✓ Comprobante listo para enviar</p>
                      )}
                      {errores.comprobante && (
                        <p style={{ fontSize: "12.5px", color: "#dc2626", marginTop: "4px" }}>{errores.comprobante}</p>
                      )}
                    </div>
                  )}
                </div>
                )}

                {/* Opción 2: Pagar con tarjeta de crédito o débito (Payphone) */}
                {metodosHabilitados.payphone && (
                <div className={styles.metodoItem}>
                  {paso === 1 && (
                  <label className={styles.radioLabel} onClick={() => setMetodoPago("payphone")}>
                    <input
                      type="radio"
                      name="metodo"
                      checked={metodoPago === "payphone"}
                      onChange={() => setMetodoPago("payphone")}
                    />
                    <div className={styles.radioTextContent}>
                      <span className={styles.radioText}>
                        <Icon name="card" size={16} className={styles.radioIcon} /> Pagar con tarjeta de crédito o débito Visa, Mastercard, Diners o Discover
                      </span>
                      <div className={styles.badgesRow}>
                        <span className={styles.visaBadge}>VISA</span>
                        <span className={styles.masterBadge} />
                        <span className={styles.dinersBadge}>Diners Club</span>
                        <span className={styles.discoverBadge}>DISCOVER</span>
                        <span className={styles.payphoneBadge}>payphone</span>
                      </div>
                    </div>
                  </label>
                  )}

                  {paso === 2 && metodoPago === "payphone" && (
                    <div className={styles.expandGrayBox}>
                      <p>
                        Usa tus tarjetas de crédito o débito Visa, Mastercard, Diners o Discover de cualquier banco del mundo y, si tienes la aplicación Payphone, utiliza tu saldo.
                      </p>
                    </div>
                  )}
                </div>
                )}

                {/* Opción 4: Pagar con código QR (JEP Fácil) */}
                {metodosHabilitados.qr && (
                <div className={styles.metodoItem}>
                  {paso === 1 && (
                  <label className={styles.radioLabel} onClick={() => setMetodoPago("qr")}>
                    <input
                      type="radio"
                      name="metodo"
                      checked={metodoPago === "qr"}
                      onChange={() => setMetodoPago("qr")}
                    />
                    <span className={styles.radioText}><Icon name="qr" size={16} className={styles.radioIcon} /> Pagar con código QR (JEP Fácil)</span>
                  </label>
                  )}

                  {paso === 2 && metodoPago === "qr" && (
                    <div className={styles.expandGrayBox}>
                      <div className={styles.avisoBox}>
                        <span className={styles.avisoIcon}><Icon name="shield" size={16} /></span>
                        <p>
                          Por favor, <strong>NO PROCEDAS SI NO ESTÁS SEGURO</strong> de que quieres realizar la compra. Escanea el código con tu app y realiza el pago. Tu pedido no se procesará hasta que se haya recibido el pago.
                        </p>
                      </div>
                      <span className={styles.fileUploadLabelText}>Sube tu comprobante de pago *</span>
                      <label className={styles.fileUploadRow}>
                        <span className={styles.fileUploadBtn}>
                          <Icon name="upload" size={15} /> Seleccionar archivo
                        </span>
                        <span className={styles.fileUploadName}>
                          {comprobanteFile ? comprobanteFile.name : "Ningún archivo seleccionado"}
                        </span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) => setComprobanteFile(e.target.files[0] || null)}
                          className={styles.fileUploadInput}
                        />
                      </label>
                      {comprobanteFile && (
                        <p className={styles.fileUploadOk}>✓ Comprobante listo para enviar</p>
                      )}
                      {errores.comprobante && (
                        <p style={{ fontSize: "12.5px", color: "#dc2626", marginTop: "4px" }}>{errores.comprobante}</p>
                      )}
                    </div>
                  )}
                </div>
                )}

              </div>

              <p className={styles.privacyNote}>
                Tus datos personales se utilizarán para procesar tu pedido, mejorar tu experiencia en esta web y otros propósitos descritos en nuestra <strong>política de privacidad</strong>.
              </p>

              {paso === 2 && (
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
              )}

              {errorGlobal && <div className={styles.errorMessage}>⚠️ {errorGlobal}</div>}

              <div className={styles.btnRow}>
                {paso === 1 ? (
                  <button type="submit" className={styles.blackBtn}>
                    Continuar
                  </button>
                ) : (
                  renderBotonPago()
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
      </div>

      <Footer />
    </div>
  );
}
