import styles from "./Badge.module.css";

const LABELS = {
  activo: "ACTIVO",
  proximamente: "PRÓXIMAMENTE",
  finalizado: "FINALIZADO",
  agotado: "AGOTADO",
};

export default function Badge({ estado }) {
  return <span className={`${styles.badge} ${styles[estado] || ""}`}>{LABELS[estado] || estado}</span>;
}
