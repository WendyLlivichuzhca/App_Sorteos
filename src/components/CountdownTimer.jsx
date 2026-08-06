import { useEffect, useState } from "react";
import styles from "./CountdownTimer.module.css";

const getParts = (target) => {
  const diff = Math.max(0, new Date(target).getTime() - Date.now());
  const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
  const horas = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const min = Math.floor((diff / (1000 * 60)) % 60);
  const seg = Math.floor((diff / 1000) % 60);
  return { dias, horas, min, seg };
};

export default function CountdownTimer({ target }) {
  const [parts, setParts] = useState(() => getParts(target));

  useEffect(() => {
    const id = setInterval(() => setParts(getParts(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  const pad = (n) => String(n).padStart(2, "0");

  return (
    <div className={styles.wrap}>
      <span className={styles.label}>Termina en:</span>
      <div className={styles.blocks}>
        {[
          ["Días", parts.dias],
          ["Horas", parts.horas],
          ["Min", parts.min],
          ["Seg", parts.seg],
        ].map(([label, value]) => (
          <div key={label} className={styles.block}>
            <span className={styles.value}>{pad(value)}</span>
            <span className={styles.unit}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
