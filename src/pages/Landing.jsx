import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import Icon from "../icons/Icon.jsx";
import { getSorteos } from "../services/api.js";
import PremioImage from "../components/PremioImage.jsx";
import { formatMoney } from "../utils/format.js";
import styles from "./Landing.module.css";

const features = [
  { icon: "shield", title: "Compra segura", text: "Tus pagos están protegidos" },
  { icon: "badgeCheck", title: "Sorteos verificados", text: "Transparencia y confianza en cada sorteo" },
  { icon: "users", title: "Ganadores reales", text: "Miles de personas ya han ganado" },
];

export default function Landing() {
  const navigate = useNavigate();
  const [destacados, setDestacados] = useState([]);

  useEffect(() => {
    getSorteos("todos", "activo")
      .then((data) => setDestacados(data.slice(0, 3)))
      .catch((err) => console.error("Error cargando sorteos destacados:", err));
  }, []);

  return (
    <div className="page">
      <Navbar variant="full" />

      {/* ── HERO + zona decorativa (hojas y formas de fondo) ── */}
      <div className={styles.decorWrap}>
        {/* Formas orgánicas de fondo */}
        <div className={`${styles.blob} ${styles.blob1}`} />
        <div className={`${styles.blob} ${styles.blob2}`} />
        <div className={`${styles.blob} ${styles.blob3}`} />

        {/* Hojitas decorativas */}
        <svg className={`${styles.leaf} ${styles.leaf1}`} viewBox="0 0 100 100" fill="none" aria-hidden="true">
          <path fill="currentColor" d="M50 5C25 15 10 40 15 65C20 88 45 98 68 90C88 83 95 60 85 40C75 20 60 8 50 5Z" />
        </svg>
        <svg className={`${styles.leaf} ${styles.leaf2}`} viewBox="0 0 100 100" fill="none" aria-hidden="true">
          <path fill="currentColor" d="M50 5C25 15 10 40 15 65C20 88 45 98 68 90C88 83 95 60 85 40C75 20 60 8 50 5Z" />
        </svg>
        <svg className={`${styles.leaf} ${styles.leaf3}`} viewBox="0 0 100 100" fill="none" aria-hidden="true">
          <path fill="currentColor" d="M50 5C25 15 10 40 15 65C20 88 45 98 68 90C88 83 95 60 85 40C75 20 60 8 50 5Z" />
        </svg>
        <svg className={`${styles.leaf} ${styles.leaf4}`} viewBox="0 0 100 100" fill="none" aria-hidden="true">
          <path fill="currentColor" d="M50 5C25 15 10 40 15 65C20 88 45 98 68 90C88 83 95 60 85 40C75 20 60 8 50 5Z" />
        </svg>
        <svg className={`${styles.leaf} ${styles.leaf5}`} viewBox="0 0 100 100" fill="none" aria-hidden="true">
          <path fill="currentColor" d="M50 5C25 15 10 40 15 65C20 88 45 98 68 90C88 83 95 60 85 40C75 20 60 8 50 5Z" />
        </svg>
        <svg className={`${styles.leaf} ${styles.leaf6}`} viewBox="0 0 100 100" fill="none" aria-hidden="true">
          <path fill="currentColor" d="M50 5C25 15 10 40 15 65C20 88 45 98 68 90C88 83 95 60 85 40C75 20 60 8 50 5Z" />
        </svg>

        {/* Destellos de luz brillante */}
        <div className={styles.glitter1} />
        <div className={styles.glitter2} />

        {/* ── HERO ── */}
        <section className={styles.hero}>
        <div className={`container ${styles.heroInner}`}>
          {/* Columna izquierda: texto */}
          <div className={styles.heroCopy}>
            <span className={styles.heroBadge}>🌿 Tu suerte, más cerca</span>
            <h1>
              Participa en los mejores <span className={styles.highlight}>sorteos</span> y gana increíbles <span className={styles.highlight}>premios</span>.
            </h1>
            <p>
              Boletos seguros, sorteos verificados<br />
              y premios increíbles te esperan.
            </p>
            <button
              type="button"
              className={styles.heroBtn}
              onClick={() => navigate("/sorteos")}
            >
              Ver sorteos disponibles&nbsp;&nbsp;→
            </button>
            <div className={styles.heroNote}>
              <Icon name="clock" size={14} />
              Sin registro, compra en segundos
            </div>
          </div>

          {/* Columna derecha: imagen de premios */}
          <div className={styles.heroArt}>
            <div className={styles.heroImgFrame}>
              <img
                src="/hero-prizes.jpg"
                alt="Terreno, auto, moto y laptop en sorteo"
                className={styles.heroImg}
              />
              <Link to="/sorteos" className={styles.heroImgBadge}>
                <Icon name="ticket" size={14} />
                Tu próximo gran premio
                <Icon name="arrowRight" size={14} />
              </Link>
              <div className={styles.heroDots}>
                <span className={styles.heroDotActive} />
                <span className={styles.heroDot} />
                <span className={styles.heroDot} />
                <span className={styles.heroDot} />
              </div>
            </div>
            <span className={styles.scriptText}>
              Sueña<br />Participa<br />Gana ✧
            </span>
          </div>
        </div>
        </section>

        {/* ── FEATURES ── */}
        <section className={`container ${styles.featuresWrap}`}>
          <div className={styles.features}>
            {features.map((f, i) => (
              <div key={f.title} className={`${styles.feature} ${i > 0 ? styles.featureSep : ""}`}>
                <span className={styles.featureIcon}>
                  <Icon name={f.icon} size={22} strokeWidth={1.6} />
                </span>
                <div>
                  <h3>{f.title}</h3>
                  <p>{f.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── SORTEOS DESTACADOS ── */}
        {destacados.length > 0 && (
          <section className={`container ${styles.destacadosSection}`}>
            <div className={styles.destacadosHeader}>
              <h2>
                <Icon name="star" size={22} className={styles.destacadosStarIcon} />
                Sorteos destacados
              </h2>
              <Link to="/sorteos" className={styles.verTodos}>Ver todos →</Link>
            </div>
            <div className={styles.destacadosGrid}>
              {destacados.map((s) => (
                <Link key={s.id} to={`/sorteos/${s.id}`} className={styles.destacadoCard}>
                  <div className={styles.destacadoImg}>
                    <PremioImage categoria={s.categoria} images={s.galeria} />
                  </div>
                  <div className={styles.destacadoBody}>
                    <span className={styles.destacadoBadge}>{s.categoria}</span>
                    <h4>{s.nombre}</h4>
                    <div className={styles.destacadoPrecio}>
                      <Icon name="ticket" size={16} />
                      {formatMoney(s.precio)} por boleto
                    </div>
                    <span className={styles.destacadoCta}>
                      Participar ahora <Icon name="arrowRight" size={15} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      <Footer />
    </div>
  );
}
