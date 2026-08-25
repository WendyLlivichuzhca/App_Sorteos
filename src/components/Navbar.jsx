import { Link, useLocation, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import Icon from "../icons/Icon.jsx";
import styles from "./Navbar.module.css";

const STEPS = [
  { id: "datos", label: "Datos" },
  { id: "pago", label: "Pago" },
  { id: "confirmacion", label: "Confirmación" },
];

export default function Navbar({ variant = "full", step }) {
  const { seleccion } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const cartCount = seleccion ? seleccion.paquete.boletos : 0;
  const dark = location.pathname === "/";

  const stepIndex = STEPS.findIndex((s) => s.id === step);

  return (
    <header className={`${styles.header} ${dark ? styles.dark : ""}`}>
      <div className={`container ${styles.inner}`}>
        <Link to="/" className={styles.logo}>
          <span className={styles.logoIcon}>
            <img src="/logo-icon.svg" alt="" className={styles.logoImg} />
          </span>
          SORTEOS <span className={styles.logoAccent}> EN LÍNEA</span>
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
          <>
            <nav className={styles.nav}>
              <Link to="/sorteos">Sorteos</Link>
              <a href="/#como-funciona">Cómo funciona</a>
              <Link to="/resultados">Resultados</Link>
              <Link to="/ayuda">Ayuda</Link>
            </nav>
            <div className={styles.actions}>
              <button type="button" className={styles.cartBtn} aria-label="Carrito" onClick={() => seleccion && navigate("/checkout/datos")}>
                <Icon name="cart" size={20} strokeWidth={1.8} />
                <span className={styles.cartBadge}>{cartCount}</span>
              </button>
            </div>
          </>
        )}

        {variant === "cart" && (
          <div className={styles.actions}>
            <button type="button" className={styles.cartBtn} aria-label="Carrito" onClick={() => seleccion && navigate("/checkout/datos")}>
              <Icon name="cart" size={20} strokeWidth={1.8} />
              {cartCount > 0 && <span className={styles.cartBadge}>{cartCount}</span>}
            </button>
          </div>
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
