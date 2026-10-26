import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { getConfiguracion } from "../services/api.js";
import Icon from "../icons/Icon.jsx";
import styles from "./WhatsAppFloat.module.css";

export default function WhatsAppFloat() {
  const { pathname } = useLocation();
  const [config, setConfig] = useState(null);

  useEffect(() => {
    getConfiguracion()
      .then(setConfig)
      .catch((err) => console.error("Error cargando configuración:", err));
  }, []);

  if (pathname.startsWith("/admin")) return null;

  const numero = config?.whatsapp?.replace(/\D/g, "");
  if (!numero) return null;

  const nombreEmpresa = config?.nombre_empresa || "El Trébol de Gaya";
  const mensaje = encodeURIComponent(`Hola, necesito ayuda con ${nombreEmpresa}.`);

  return (
    <a
      href={`https://wa.me/${numero}?text=${mensaje}`}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.btn}
      aria-label="Escríbenos por WhatsApp"
      title="Escríbenos por WhatsApp"
    >
      <Icon name="whatsapp" size={28} strokeWidth={1.9} />
    </a>
  );
}
