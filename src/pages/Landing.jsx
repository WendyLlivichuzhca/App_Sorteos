import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Icon from "../icons/Icon.jsx";
import { getSorteos, getCategorias } from "../services/api.js";
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
  const [categorias, setCategorias] = useState([]);

  useEffect(() => {
    getSorteos("todos", "activo")
      .then((data) => setDestacados(data.slice(0, 3)))
      .catch((err) => console.error("Error cargando sorteos destacados:", err));
    getCategorias()
      .then(setCategorias)
      .catch((err) => console.error("Error cargando categorías:", err));
  }, []);

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

      {/* ── CATEGORÍAS ── */}
      <section className={`container ${styles.categoriasSection}`}>
        <h2>Categorías populares</h2>
        <div className={styles.categorias}>
          {categorias.map((c) => (
            <Link key={c.id} to={`/sorteos?categoria=${c.slug}`} className={styles.categoria}>
              <span className={styles.categoriaIcon}>
                <Icon name={c.icono} size={24} strokeWidth={1.6} />
              </span>
              {c.nombre}
            </Link>
          ))}
        </div>
      </section>

      {/* ── SORTEOS DESTACADOS ── */}
      {destacados.length > 0 && (
        <section className={`container ${styles.destacadosSection}`}>
          <div className={styles.destacadosHeader}>
            <h2>Sorteos destacados</h2>
            <Link to="/sorteos" className={styles.verTodos}>Ver todos →</Link>
          </div>
          <div className={styles.destacadosGrid}>
            {destacados.map((s) => (
              <Link key={s.id} to={`/sorteos/${s.id}`} className={styles.destacadoCard}>
                <div className={styles.destacadoImg}>
                  <PremioImage categoria={s.categoria} />
                </div>
                <div className={styles.destacadoBody}>
                  <h4>{s.nombre}</h4>
                  <span>{formatMoney(s.precio)} por boleto</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
