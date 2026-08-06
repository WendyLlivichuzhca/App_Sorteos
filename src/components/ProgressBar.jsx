import styles from "./ProgressBar.module.css";

export default function ProgressBar({ vendidos, total }) {
  const pct = Math.min(100, Math.round((vendidos / total) * 100));
  return (
    <div className={styles.wrap}>
      <div className={styles.metaRow}>
        <span className={styles.vendidos}>{vendidos} vendidos</span>
        <span className={styles.pct}>{pct}%</span>
      </div>
      <div className={styles.track}>
        <div className={styles.fill} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
