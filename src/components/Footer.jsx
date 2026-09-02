import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getConfiguracion } from "../services/api.js";
import Icon from "../icons/Icon.jsx";
import styles from "./Footer.module.css";

export default function Footer() {
  const [config, setConfig] = useState(null);

  useEffect(() => {
    getConfiguracion()
      .then(setConfig)
      .catch((err) => console.error("Error cargando configuración:", err));
  }, []);

  const correo = config?.correo || "soporte@eltreboldegaya.com";
  const whatsapp = config?.whatsapp?.replace(/\D/g, "") || "593999999999";
  const nombreEmpresa = config?.nombre_empresa || "El Trébol de Gaya";
  const logoUrl = config?.logo_url || "/logo-icon.svg";
  const instagram = config?.instagram || "";
  const facebook = config?.facebook || "";
  const tiktok = config?.tiktok || "";

  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.brand}>
          <span className={styles.logo}>
            <span className={styles.logoIcon}>
              <img src={logoUrl} alt="" className={styles.logoImg} />
            </span>
            {nombreEmpresa}
          </span>
          <p>Sorteos verificados con premios reales. Compra segura y transparente.</p>
          {(instagram || facebook || tiktok) && (
            <div className={styles.socialRow}>
              {instagram && (
                <a href={instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className={styles.socialBtn}>
                  <Icon name="instagram" size={17} />
                </a>
              )}
              {facebook && (
                <a href={facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className={styles.socialBtn}>
                  <Icon name="facebook" size={17} />
                </a>
              )}
              {tiktok && (
                <a href={tiktok} target="_blank" rel="noopener noreferrer" aria-label="TikTok" className={styles.socialBtn}>
                  <Icon name="tiktok" size={17} />
                </a>
              )}
            </div>
          )}
        </div>

        <div className={styles.col}>
          <h4>Plataforma</h4>
          <Link to="/sorteos">Sorteos</Link>
          <Link to="/como-funciona">Cómo funciona</Link>
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
      <div className={styles.bottom}>© {new Date().getFullYear()} {nombreEmpresa}. Todos los derechos reservados.</div>
    </footer>
  );
}
