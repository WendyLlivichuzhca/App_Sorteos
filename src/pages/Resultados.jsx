import { Link } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Icon from "../icons/Icon.jsx";
import { ganadores } from "../data/sorteos.js";
import PremioImage from "../components/PremioImage.jsx";
import styles from "./Resultados.module.css";

export default function Resultados() {
  return (
    <div className="page">
      <Navbar variant="full" />

      <div className={`container ${styles.wrap}`}>
        <div className={styles.header}>
          <h1>🏆 Ganadores y Resultados</h1>
          <p className={styles.subtitle}>
            Transparencia total. Consulta los boletos ganadores y premios entregados en cada sorteo.
          </p>
        </div>

        <div className={styles.statsStrip}>
          <div className={styles.stat}>
            <strong>100%</strong>
            <span>Verificados</span>
          </div>
          <div className={styles.stat}>
            <strong>$45,000+</strong>
            <span>En premios entregados</span>
          </div>
          <div className={styles.stat}>
            <strong>1,200+</strong>
            <span>Ganadores felices</span>
          </div>
        </div>

        <h2 className={styles.sectionTitle}>Últimos ganadores</h2>

        <div className={styles.grid}>
          {ganadores.map((g) => (
            <div key={g.id} className={styles.card}>
              <div className={styles.imgWrap}>
                <PremioImage categoria={g.categoria} className={styles.img} />
                <span className={styles.deliveredBadge}>
                  <Icon name="check" size={14} strokeWidth={3} /> Premio entregado
                </span>
              </div>

              <div className={styles.body}>
                <span className={styles.category}>{g.categoria.toUpperCase()}</span>
                <h3>{g.sorteo}</h3>

                <div className={styles.winnerInfo}>
                  <div className={styles.winnerAvatar}>
                    <Icon name="users" size={18} />
                  </div>
                  <div>
                    <strong className={styles.winnerName}>{g.ganador}</strong>
                    <span className={styles.winnnerCity}>{g.ciudad}</span>
                  </div>
                </div>

                <div className={styles.ticketBox}>
                  <span className={styles.ticketLabel}>Boleto ganador</span>
                  <span className={styles.ticketBadge}>{g.boleto}</span>
                </div>

                <div className={styles.dateRow}>
                  <Icon name="clock" size={14} />
                  <span>Sorteado el {g.fecha}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
