import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getConfiguracion } from "../services/api.js";
import Icon from "../icons/Icon.jsx";
import styles from "./Navbar.module.css";

const NOMBRE_POR_DEFECTO = "El Trébol de Gaya";

const STEPS = [
  { id: "datos", label: "Datos" },
  { id: "pago", label: "Pago" },
  { id: "confirmacion", label: "Confirmación" },
];

export default function Navbar({ variant = "full", step }) {
  const location = useLocation();
  const navigate = useNavigate();
  const dark = location.pathname === "/";
  const [nombreEmpresa, setNombreEmpresa] = useState(NOMBRE_POR_DEFECTO);

  const stepIndex = STEPS.findIndex((s) => s.id === step);

  useEffect(() => {
    getConfiguracion()
      .then((config) => {
        const nombre = config.nombre_empresa || NOMBRE_POR_DEFECTO;
        setNombreEmpresa(nombre);
        document.title = nombre;
      })
      .catch((err) => console.error("Error cargando configuración:", err));
  }, []);

  return (
    <header className={`${styles.header} ${dark ? styles.dark : ""}`}>
      <div className={`container ${styles.inner}`}>
        <Link to="/" className={styles.logo}>
          <span className={styles.logoIcon}>
            <img src="/logo-icon.svg" alt="" className={styles.logoImg} />
          </span>
          {nombreEmpresa}
        </Link>

        {variant === "full" && (
          <>
            <nav className={styles.nav}>
              <Link to="/sorteos">Sorteos</Link>
              <a href="/#como-funciona">Cómo funciona</a>
              <Link to="/resultados">Resultados</Link>
              <Link to="/ayuda">Ayuda</Link>
            </nav>
            <div className={styles.actions}>
              <button
                type="button"
                className={`btn btn-primary btn-sm ${styles.consultarBtn}`}
                onClick={() => navigate("/consultar-boletos")}
              >
                Consultar boletos
              </button>
            </div>
          </>
        )}

        {variant === "nav" && (
          <nav className={styles.nav}>
            <Link to="/sorteos">Sorteos</Link>
            <a href="/#como-funciona">Cómo funciona</a>
            <Link to="/resultados">Resultados</Link>
            <Link to="/ayuda">Ayuda</Link>
          </nav>
        )}

        {variant === "checkout" && (
          <ol className={styles.stepper}>
            {STEPS.map((s, i) => (
              <li key={s.id} className={i <= stepIndex ? styles.stepDone : ""}>
                <span className={styles.stepDot}>{i < stepIndex ? <Icon name="check" size={12} strokeWidth={3} /> : i + 1}</span>
                {s.label}
                {i < STEPS.length - 1 && <span className={styles.stepLine} />}
              </li>
            ))}
          </ol>
        )}
      </div>
    </header>
  );
}
