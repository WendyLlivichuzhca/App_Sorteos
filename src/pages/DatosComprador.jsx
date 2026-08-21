import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Icon from "../icons/Icon.jsx";
import PremioImage from "../components/PremioImage.jsx";
import { useApp } from "../context/AppContext.jsx";
import { formatMoney } from "../utils/format.js";
import styles from "./DatosComprador.module.css";

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

export default function DatosComprador() {
  const navigate = useNavigate();
  const { seleccion, comprador, setComprador } = useApp();
  const [form, setForm] = useState(
    comprador || {
      tipoDocumento: "cedula",
      cedula: "",
      nombres: "",
      apellidos: "",
      correo: "",
      confirmarCorreo: "",
      celular: "",
      provincia: "Azuay",
      ciudad: "",
      direccion: "",
    }
  );
  const [errores, setErrores] = useState({});

  useEffect(() => {
    if (!seleccion) navigate("/sorteos", { replace: true });
  }, [seleccion, navigate]);

  if (!seleccion) return null;

  const { sorteo, paquete } = seleccion;

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const validar = () => {
    const errs = {};
    if (!form.nombres.trim()) errs.nombres = "Ingresa tus nombres";
    if (!form.apellidos.trim()) errs.apellidos = "Ingresa tus apellidos";
    if (!/^\S+@\S+\.\S+$/.test(form.correo)) errs.correo = "Ingresa un correo válido";
    if (form.correo !== form.confirmarCorreo) errs.confirmarCorreo = "Los correos no coinciden";
    if (!/^\d{7,10}$/.test(form.celular)) errs.celular = "Ingresa un número de celular válido";
    if (!/^\d{6,13}$/.test(form.cedula)) errs.cedula = "Ingresa un número de documento válido";
    if (!form.ciudad.trim()) errs.ciudad = "Ingresa tu ciudad o cantón";

    setErrores(errs);
    return Object.keys(errs).length === 0;
  };

  const continuarAlPago = (e) => {
    e.preventDefault();
    if (!validar()) return;
    
    // Guardamos el nombre completo concatenado para compatibilidad con el resto del sistema
    const compradorCompleto = {
      ...form,
      nombre: `${form.nombres.trim()} ${form.apellidos.trim()}`,
    };
    
    setComprador(compradorCompleto);
    navigate("/checkout/pago");
  };

  return (
    <div className="page">
      <Navbar variant="checkout" step="datos" />

      <div className={`container ${styles.wrap}`}>
        <Link to={`/sorteos/${sorteo.id}/paquetes`} className={styles.volver}>
          <Icon name="chevronLeft" size={16} /> Volver a paquetes
        </Link>

        <div className={styles.grid}>
          {/* Columna Izquierda: Datos de Facturación / Comprador */}
          <div className={styles.formCol}>
            <div className={styles.headerTitle}>
              <h1>Datos de Facturación</h1>
              <p>Ingresa tus datos personales para registrar la compra de tus boletos.</p>
            </div>

            <form onSubmit={continuarAlPago} noValidate className={styles.formGrid}>
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
                  <span>Número Cédula / RUC / Pasaporte *</span>
                  <input
                    type="text"
                    placeholder="Ej. 1712345678"
                    value={form.cedula}
                    onChange={handleChange("cedula")}
                  />
                  {errores.cedula && <em>{errores.cedula}</em>}
                </label>
              </div>

              <div className={styles.rowTwo}>
                <label className={styles.field}>
                  <span>Nombres *</span>
                  <input
                    type="text"
                    placeholder="Nombres"
                    value={form.nombres}
                    onChange={handleChange("nombres")}
                  />
                  {errores.nombres && <em>{errores.nombres}</em>}
                </label>

                <label className={styles.field}>
                  <span>Apellidos *</span>
                  <input
                    type="text"
                    placeholder="Apellidos"
                    value={form.apellidos}
                    onChange={handleChange("apellidos")}
                  />
                  {errores.apellidos && <em>{errores.apellidos}</em>}
                </label>
              </div>

              <div className={styles.rowTwo}>
                <label className={styles.field}>
                  <span>Correo electrónico *</span>
                  <input
                    type="email"
                    placeholder="Email"
                    value={form.correo}
                    onChange={handleChange("correo")}
                  />
                  {errores.correo && <em>{errores.correo}</em>}
                </label>

                <label className={styles.field}>
                  <span>Confirmar correo electrónico *</span>
                  <input
                    type="email"
                    placeholder="Confirmar email"
                    value={form.confirmarCorreo}
                    onChange={handleChange("confirmarCorreo")}
                  />
                  {errores.confirmarCorreo && <em>{errores.confirmarCorreo}</em>}
                </label>
              </div>

              <label className={styles.field}>
                <span>Teléfono / Celular (WhatsApp) *</span>
                <div className={styles.inputIcon}>
                  <input
                    type="tel"
                    placeholder="Ej. 0991234567"
                    value={form.celular}
                    onChange={handleChange("celular")}
                  />
                  <Icon name="whatsapp" size={19} className={styles.whatsappIcon} />
                </div>
                {errores.celular && <em>{errores.celular}</em>}
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
                  <span>Ciudad / Cantón *</span>
                  <input
                    type="text"
                    placeholder="Ej. Cuenca / Sucúa"
                    value={form.ciudad}
                    onChange={handleChange("ciudad")}
                  />
                  {errores.ciudad && <em>{errores.ciudad}</em>}
                </label>
              </div>

              <label className={styles.field}>
                <span>Dirección de la calle (opcional)</span>
                <input
                  type="text"
                  placeholder="Ej. Av. Principal N12-34"
                  value={form.direccion}
                  onChange={handleChange("direccion")}
                />
              </label>

              <button type="submit" className={`btn btn-primary btn-block ${styles.submitBtn}`}>
                Continuar al pago <Icon name="arrowRight" size={17} />
              </button>
            </form>

            <p className={styles.privacidad}>
              <Icon name="lock" size={13} /> Tus datos están protegidos y encriptados bajo protocolos de seguridad.
            </p>
          </div>

          {/* Columna Derecha: Resumen de Tu Pedido */}
          <div className={styles.summaryCol}>
            <div className={styles.summaryCard}>
              <h3>Tu Pedido</h3>

              <div className={styles.itemBox}>
                <div className={styles.itemImg}>
                  <PremioImage categoria={sorteo.categoria} src={sorteo.imagenUrl} iconSize={32} />
                </div>
                <div className={styles.itemDetails}>
                  <h4>{sorteo.nombre}</h4>
                  <span>
                    {paquete.boletos} {paquete.boletos === 1 ? "Boleto" : "Boletos"} × {formatMoney(sorteo.precio)}
                  </span>
                </div>
                <strong className={styles.itemPrice}>{formatMoney(paquete.precio)}</strong>
              </div>

              <div className={styles.breakdown}>
                <div className={styles.row}>
                  <span>Subtotal</span>
                  <strong>{formatMoney(paquete.precio)}</strong>
                </div>
                {paquete.ahorra > 0 && (
                  <div className={`${styles.row} ${styles.rowDescuento}`}>
                    <span>Descuento aplicado</span>
                    <span>-{paquete.ahorra}%</span>
                  </div>
                )}
                <div className={`${styles.row} ${styles.rowTotal}`}>
                  <span>Total</span>
                  <strong>{formatMoney(paquete.precio)}</strong>
                </div>
              </div>

              <div className={styles.guaranteeBox}>
                <div className={styles.guaranteeItem}>
                  <Icon name="shield" size={16} /> <span>Boletos oficiales verificados</span>
                </div>
                <div className={styles.guaranteeItem}>
                  <Icon name="lock" size={16} /> <span>Transacción 100% segura</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
