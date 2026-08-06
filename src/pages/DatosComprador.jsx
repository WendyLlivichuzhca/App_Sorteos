import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Icon from "../icons/Icon.jsx";
import { useApp } from "../context/AppContext.jsx";
import styles from "./DatosComprador.module.css";

export default function DatosComprador() {
  const navigate = useNavigate();
  const { seleccion, comprador, setComprador } = useApp();
  const [form, setForm] = useState(comprador || { nombre: "", correo: "", celular: "", cedula: "" });
  const [errores, setErrores] = useState({});

  useEffect(() => {
    if (!seleccion) navigate("/sorteos", { replace: true });
  }, [seleccion, navigate]);

  if (!seleccion) return null;

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const validar = () => {
    const errs = {};
    if (!form.nombre.trim()) errs.nombre = "Ingresa tu nombre completo";
    if (!/^\S+@\S+\.\S+$/.test(form.correo)) errs.correo = "Ingresa un correo válido";
    if (!/^\d{7,10}$/.test(form.celular)) errs.celular = "Ingresa un número de celular válido";
    if (!/^\d{6,10}$/.test(form.cedula)) errs.cedula = "Ingresa una cédula válida";
    setErrores(errs);
    return Object.keys(errs).length === 0;
  };

  const continuarAlPago = (e) => {
    e.preventDefault();
    if (!validar()) return;
    setComprador(form);
    navigate("/checkout/pago");
  };

  return (
    <div className="page">
      <Navbar variant="checkout" step="datos" />

      <div className={`container ${styles.wrap}`}>
        <Link to={`/sorteos/${seleccion.sorteo.id}/paquetes`} className={styles.volver}>
          <Icon name="chevronLeft" size={16} /> Volver
        </Link>

        <div className={styles.card}>
          <h1>
            Antes de continuar <br /> necesitamos tus datos
          </h1>

          <form onSubmit={continuarAlPago} noValidate>
            <label className={styles.field}>
              <span>Nombre completo</span>
              <input
                type="text"
                placeholder="Ej. Juan Pérez"
                value={form.nombre}
                onChange={handleChange("nombre")}
              />
              {errores.nombre && <em>{errores.nombre}</em>}
            </label>

            <label className={styles.field}>
              <span>Correo electrónico</span>
              <input
                type="email"
                placeholder="Ej. juanperez@gmail.com"
                value={form.correo}
                onChange={handleChange("correo")}
              />
              {errores.correo && <em>{errores.correo}</em>}
            </label>

            <label className={styles.field}>
              <span>Celular</span>
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

            <label className={styles.field}>
              <span>Cédula de identidad</span>
              <input
                type="text"
                placeholder="Ej. 1712345678"
                value={form.cedula}
                onChange={handleChange("cedula")}
              />
              {errores.cedula && <em>{errores.cedula}</em>}
            </label>

            <button type="submit" className={`btn btn-primary btn-block ${styles.submitBtn}`}>
              Continuar al pago <Icon name="arrowRight" size={17} />
            </button>
          </form>

          <p className={styles.privacidad}>
            <Icon name="lock" size={13} /> Tus datos están protegidos y no serán compartidos.
          </p>
        </div>
      </div>
    </div>
  );
}
