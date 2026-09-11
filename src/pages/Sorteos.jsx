import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import Badge from "../components/Badge.jsx";
import ProgressBar from "../components/ProgressBar.jsx";
import PremioImage from "../components/PremioImage.jsx";
import Icon from "../icons/Icon.jsx";
import { getSorteos, getCategorias } from "../services/api.js";
import { formatMoney } from "../utils/format.js";
import styles from "./Sorteos.module.css";

const leafPath = "M50 5C25 15 10 40 15 65C20 88 45 98 68 90C88 83 95 60 85 40C75 20 60 8 50 5Z";

export default function Sorteos() {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [categoria, setCategoria] = useState(searchParams.get("categoria") || "todos");
  const [sorteos, setSorteos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getSorteos()
      .then((data) => {
        setSorteos(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error cargando sorteos:", err);
        setLoading(false);
      });
    getCategorias()
      .then(setCategorias)
      .catch((err) => console.error("Error cargando categorías:", err));
  }, []);

  const filtrados = sorteos.filter((s) => {
    const matchCategoria = categoria === "todos" || s.categoria === categoria;
    const matchQuery = s.nombre.toLowerCase().includes(query.toLowerCase());
    return matchCategoria && matchQuery;
  });

  return (
    <div className="page">
      <Navbar variant="nav" />

      <div className={styles.decorWrap}>
        <div className={`${styles.blob} ${styles.blob1}`} />
        <div className={`${styles.blob} ${styles.blob2}`} />
        <svg className={`${styles.leaf} ${styles.leaf1}`} viewBox="0 0 100 100" fill="none" aria-hidden="true"><path fill="currentColor" d={leafPath} /></svg>
        <svg className={`${styles.leaf} ${styles.leaf2}`} viewBox="0 0 100 100" fill="none" aria-hidden="true"><path fill="currentColor" d={leafPath} /></svg>
        <svg className={`${styles.leaf} ${styles.leaf3}`} viewBox="0 0 100 100" fill="none" aria-hidden="true"><path fill="currentColor" d={leafPath} /></svg>
        <svg className={`${styles.leaf} ${styles.leaf4}`} viewBox="0 0 100 100" fill="none" aria-hidden="true"><path fill="currentColor" d={leafPath} /></svg>
        <span className={styles.scriptText}>La suerte también<br />se elige ♡</span>

        <div className={`container ${styles.wrap}`}>
          <span className={styles.eyebrow}>🍀 Todos los sorteos</span>
          <h1>Todos los <span className={styles.highlight}>sorteos</span></h1>
          <p className={styles.subtitle}>Elige tu favorito y participa</p>

        <div className={styles.searchBox}>
          <Icon name="search" size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Buscar sorteos, premios..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className={styles.filtros}>
          <button
            type="button"
            className={`${styles.filtro} ${categoria === "todos" ? styles.filtroActivo : ""}`}
            onClick={() => setCategoria("todos")}
          >
            Todos
          </button>
          {categorias.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`${styles.filtro} ${categoria === c.slug ? styles.filtroActivo : ""}`}
              onClick={() => setCategoria(c.slug)}
            >
              {c.nombre}
            </button>
          ))}
        </div>

        <div className={styles.grid}>
          {filtrados.map((s) => (
            <div key={s.id} className={styles.card}>
              <div className={styles.imgWrap}>
                <PremioImage categoria={s.categoria} images={s.galeria} className={styles.img} />
                <div className={styles.badgeWrap}>
                  <Badge estado={s.estado} />
                </div>
              </div>

              <div className={styles.body}>
                <h3 className={styles.cardTitle}>{s.nombre}</h3>

                {s.estado === "proximamente" ? (
                  <p className={styles.inicia}>Muy pronto</p>
                ) : s.estado === "finalizado" ? (
                  <p className={styles.inicia}>Sorteo finalizado</p>
                ) : s.estado === "agotado" ? (
                  <p className={styles.inicia}>Boletos 100% agotados</p>
                ) : (
                  <ProgressBar vendidos={s.vendidos} total={s.total} />
                )}

                <div className={styles.footer}>
                  {s.estado === "activo" && (
                    <>
                      <div className={styles.precio}>
                        <span className={styles.precioIcon}>
                          <Icon name="ticket" size={15} />
                        </span>
                        <div>
                          <strong>{formatMoney(s.precio)}</strong>
                          <span>por boleto</span>
                        </div>
                      </div>
                      <Link to={`/sorteos/${s.id}`} className={styles.btnVerSorteo}>
                        Ver sorteo <Icon name="arrowRight" size={14} />
                      </Link>
                    </>
                  )}
                  {s.estado === "proximamente" && (
                    <Link to={`/sorteos/${s.id}`} className={styles.btnVerDetalles}>
                      Ver detalles
                    </Link>
                  )}
                  {s.estado === "finalizado" && (
                    <Link to={`/resultados`} className={styles.btnVerDetalles}>
                      Ver ganador 🏆
                    </Link>
                  )}
                  {s.estado === "agotado" && (
                    <Link to={`/sorteos/${s.id}`} className={styles.btnAgotado}>
                      Boletos agotados
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}

          {filtrados.length === 0 && (
            <p className={styles.empty}>No se encontraron sorteos con esos filtros.</p>
          )}
        </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
