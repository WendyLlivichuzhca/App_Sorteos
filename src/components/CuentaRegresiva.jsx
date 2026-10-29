import { useEffect, useState } from "react";
import { momentoCierre } from "../utils/format.js";
import styles from "./CuentaRegresiva.module.css";

// Cuenta regresiva hasta el cierre de ventas de un sorteo por fecha.
// Cuando llega a cero avisa con onFin para que la página cierre la compra sin recargar.
export default function CuentaRegresiva({ fechaCierre, onFin }) {
  const cierre = momentoCierre(fechaCierre);
  const [ahora, setAhora] = useState(() => Date.now());

  useEffect(() => {
    if (cierre === null) return undefined;
    const id = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(id);
  }, [cierre]);

  const faltan = cierre === null ? 0 : Math.max(0, cierre - ahora);

  useEffect(() => {
    if (cierre !== null && faltan === 0 && onFin) onFin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faltan, cierre]);

  if (cierre === null || faltan === 0) return null;

  const segundos = Math.floor(faltan / 1000);
  const partes = [
    { valor: Math.floor(segundos / 86400), etiqueta: "días" },
    { valor: Math.floor((segundos % 86400) / 3600), etiqueta: "horas" },
    { valor: Math.floor((segundos % 3600) / 60), etiqueta: "min" },
    { valor: segundos % 60, etiqueta: "seg" },
  ];

  return (
    <div className={styles.wrap} role="timer" aria-label="Tiempo que falta para el cierre de ventas">
      {partes.map((p) => (
        <div key={p.etiqueta} className={styles.caja}>
          <strong>{String(p.valor).padStart(2, "0")}</strong>
          <span>{p.etiqueta}</span>
        </div>
      ))}
    </div>
  );
}
