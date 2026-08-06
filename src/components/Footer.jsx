import { Link } from "react-router-dom";
import Icon from "../icons/Icon.jsx";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.brand}>
          <span className={styles.logo}>
            <span className={styles.logoIcon}>
              <Icon name="mail" size={16} strokeWidth={2} />
            </span>
            SORTEOS <span className={styles.logoAccent}>EN LÍNEA</span>
          </span>
          <p>Sorteos verificados con premios reales. Compra segura y transparente.</p>
        </div>

        <div className={styles.col}>
          <h4>Plataforma</h4>
          <Link to="/sorteos">Sorteos</Link>
          <a href="/#como-funciona">Cómo funciona</a>
          <Link to="/resultados">Resultados</Link>
        </div>

        <div className={styles.col}>
          <h4>Soporte</h4>
          <Link to="/ayuda">Ayuda</Link>
          <Link to="/consultar-boletos">Consultar boletos</Link>
          <a href="/ayuda">Términos y condiciones</a>
        </div>

        <div className={styles.col}>
          <h4>Contacto</h4>
          <a href="mailto:soporte@sorteosenlinea.com">soporte@sorteosenlinea.com</a>
          <a href="https://wa.me/593999999999" target="_blank" rel="noopener noreferrer">WhatsApp Soporte</a>
        </div>
      </div>
      <div className={styles.bottom}>© {new Date().getFullYear()} Sorteos en Línea. Todos los derechos reservados.</div>
    </footer>
  );
}
