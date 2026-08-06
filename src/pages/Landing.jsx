import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Icon from "../icons/Icon.jsx";
import { categorias, sorteos } from "../data/sorteos.js";
import PremioImage from "../components/PremioImage.jsx";
import styles from "./Landing.module.css";

const features = [
  { icon: "shield", title: "Compra segura", text: "Tus pagos están protegidos" },
  { icon: "badgeCheck", title: "Sorteos verificados", text: "Transparencia y confianza en cada sorteo" },
  { icon: "users", title: "Ganadores reales", text: "Miles de personas ya han ganado" },
];

export default function Landing() {
  const navigate = useNavigate();
  const destacados = sorteos.slice(0, 3);

  return (
    <div className="page">
      <Navbar variant="full" />

      {/* ── HERO ── */}
      <section className={styles.hero}>
        {/* Tarjetas ticket flotantes */}
        <div className={`${styles.spark} ${styles.spark1}`} />
        <div className={`${styles.spark} ${styles.spark2}`} />
        <div className={`${styles.spark} ${styles.spark3}`} />
        <div className={`${styles.spark} ${styles.spark4}`} />

        {/* Destellos de luz brillante */}
        <div className={styles.glitter1} />
        <div className={styles.glitter2} />
        <div className={styles.glitter3} />
        <div className={styles.glitter4} />
        <div className={styles.glitter5} />

        <div className={`container ${styles.heroInner}`}>
          {/* Columna izquierda: texto */}
          <div className={styles.heroCopy}>
            <h1>
              Participa en<br />
              los mejores sorteos<br />
              y gana increíbles<br />
              premios.
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
            <img
              src="/hero-prizes.png"
              alt="Premios: auto, moto y laptop"
              className={styles.heroImg}
            />
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className={`container ${styles.featuresWrap}`} id="como-funciona">
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

      {/* ── CATEGORÍAS ── */}
      <section className={`container ${styles.categoriasSection}`}>
        <h2>Categorías populares</h2>
        <div className={styles.categorias}>
          {categorias.map((c) => (
            <Link key={c.id} to="/sorteos" className={styles.categoria}>
              <span className={styles.categoriaIcon}>
                <Icon name={c.icon} size={24} strokeWidth={1.6} />
              </span>
              {c.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
