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

      <div className={`container ${styles.wrap}`}>
        <h1>Todos los sorteos</h1>
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
                <PremioImage categoria={s.categoria} className={styles.img} />
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
                        <strong>{formatMoney(s.precio)}</strong>
                        <span>por boleto</span>
                      </div>
                      <Link to={`/sorteos/${s.id}`} className={styles.btnVerSorteo}>
                        Ver sorteo
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

      <Footer />
    </div>
  );
}
