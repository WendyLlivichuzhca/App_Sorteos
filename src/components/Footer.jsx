import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getConfiguracion } from "../services/api.js";
import styles from "./Footer.module.css";

export default function Footer() {
  const [config, setConfig] = useState(null);

  useEffect(() => {
    getConfiguracion()
      .then(setConfig)
      .catch((err) => console.error("Error cargando configuración:", err));
  }, []);

  const correo = config?.correo || "soporte@sorteosenlinea.com";
  const whatsapp = config?.whatsapp?.replace(/\D/g, "") || "593999999999";

  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.brand}>
          <span className={styles.logo}>
            <span className={styles.logoIcon}>
              <img src="/logo-icon.svg" alt="" className={styles.logoImg} />
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
          <a href={`mailto:${correo}`}>{correo}</a>
          <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer">WhatsApp Soporte</a>
        </div>
      </div>
      <div className={styles.bottom}>© {new Date().getFullYear()} Sorteos en Línea. Todos los derechos reservados.</div>
    </footer>
  );
}
