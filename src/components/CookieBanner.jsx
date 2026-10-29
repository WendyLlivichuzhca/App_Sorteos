import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cargarPixel, getConsentimiento, guardarConsentimiento, pixelPageView } from "../utils/pixel.js";
import styles from "./CookieBanner.module.css";

export default function CookieBanner() {
  const { pathname } = useLocation();
  const [decidido, setDecidido] = useState(() => getConsentimiento() !== null);

  if (decidido || pathname.startsWith("/admin")) return null;

  const decidir = (valor) => {
    guardarConsentimiento(valor);
    setDecidido(true);
    if (valor === "aceptado") {
      cargarPixel();
      pixelPageView(pathname);
    }
  };

  return (
    <div className={styles.banner} role="dialog" aria-label="Aviso de cookies">
      <p>
        Usamos cookies y herramientas de Meta (Facebook e Instagram) para medir qué publicidad funciona y mostrarte
        anuncios relevantes. No usamos tu cédula, correo ni teléfono para esto. Más información en{" "}
        <Link to="/privacidad">Política de privacidad</Link>.
      </p>
      <div className={styles.acciones}>
        <button type="button" className={styles.rechazar} onClick={() => decidir("rechazado")}>
          Rechazar
        </button>
        <button type="button" className={styles.aceptar} onClick={() => decidir("aceptado")}>
          Aceptar
        </button>
      </div>
    </div>
  );
}
