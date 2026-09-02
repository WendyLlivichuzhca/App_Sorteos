import { useEffect, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import Icon from "../icons/Icon.jsx";
import { getGanadores } from "../services/api.js";
import PremioImage from "../components/PremioImage.jsx";
import styles from "./Resultados.module.css";

const NOMBRES_LUGAR = ["1er Lugar", "2do Lugar", "3er Lugar", "4to Lugar", "5to Lugar"];
const nombreLugar = (orden) => NOMBRES_LUGAR[orden - 1] || `${orden}° Lugar`;

export default function Resultados() {
  const [ganadores, setGanadores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getGanadores()
      .then((data) => setGanadores(data))
      .catch((err) => console.error("Error cargando ganadores:", err))
      .finally(() => setLoading(false));
  }, []);

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

        <h2 className={styles.sectionTitle}>Últimos ganadores</h2>

        {loading && <p>Cargando ganadores...</p>}

        {!loading && ganadores.length === 0 && (
          <p>Todavía no se ha sorteado ningún ganador. ¡Vuelve pronto!</p>
        )}

        <div className={styles.grid}>
          {ganadores.map((g) => (
            <div key={g.id} className={styles.card}>
              <div className={styles.imgWrap}>
                <PremioImage categoria={g.categoria} className={styles.img} />
                {Boolean(g.premio_entregado) && (
                  <span className={styles.deliveredBadge}>
                    <Icon name="check" size={14} strokeWidth={3} /> Premio entregado
                  </span>
                )}
              </div>

              <div className={styles.body}>
                {g.categoria && <span className={styles.category}>{g.categoria.toUpperCase()}</span>}
                <h3>{g.premio || g.sorteo_nombre}</h3>
                {g.premio && g.sorteo_nombre && (
                  <p className={styles.sorteoOrigen}>
                    {nombreLugar(g.orden)} — {g.sorteo_nombre}
                  </p>
                )}

                <div className={styles.winnerInfo}>
                  <div className={styles.winnerAvatar}>
                    <Icon name="users" size={18} />
                  </div>
                  <div>
                    <strong className={styles.winnerName}>{g.cliente_nombre}</strong>
                  </div>
                </div>

                <div className={styles.ticketBox}>
                  <span className={styles.ticketLabel}>Boleto ganador</span>
                  <span className={styles.ticketBadge}>#{g.boleto_numero}</span>
                </div>

                <div className={styles.dateRow}>
                  <Icon name="clock" size={14} />
                  <span>Sorteado el {new Date(g.fecha_sorteo).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}
