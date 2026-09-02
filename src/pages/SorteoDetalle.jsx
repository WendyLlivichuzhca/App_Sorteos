import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import Badge from "../components/Badge.jsx";
import StarRating from "../components/StarRating.jsx";
import PremioImage from "../components/PremioImage.jsx";
import CountdownTimer from "../components/CountdownTimer.jsx";
import Icon from "../icons/Icon.jsx";
import { getSorteoById, getPremiadosPublic } from "../services/api.js";
import { formatMoney } from "../utils/format.js";
import styles from "./SorteoDetalle.module.css";

export default function SorteoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sorteo, setSorteo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [premiados, setPremiados] = useState([]);

  useEffect(() => {
    setLoading(true);
    getSorteoById(id)
      .then((data) => {
        setSorteo(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error al obtener sorteo:", err);
        setLoading(false);
      });
    getPremiadosPublic(id)
      .then(setPremiados)
      .catch((err) => console.error("Error al obtener números premiados:", err));
  }, [id]);

  if (loading) {
    return (
      <div className="page">
        <Navbar variant="nav" />
        <div className="container">Cargando...</div>
      </div>
    );
  }

  if (!sorteo) {
    return (
      <div className="page">
        <Navbar variant="nav" />
        <div className={`container ${styles.notFound}`}>
          <p>No encontramos este sorteo.</p>
          <Link to="/sorteos" className="btn btn-primary">Volver a sorteos</Link>
        </div>
      </div>
    );
  }

  const pctVendido = Math.round((sorteo.vendidos / sorteo.total) * 100);

  return (
    <div className="page">
      <Navbar variant="nav" />

      <div className={`container ${styles.wrap}`}>
        <Link to="/sorteos" className={styles.volver}>
          <Icon name="chevronLeft" size={16} /> Volver a sorteos
        </Link>

        <div className={styles.grid}>
          <div className={styles.gallery}>
            <div className={styles.mainImg}>
              <PremioImage categoria={sorteo.categoria} src={sorteo.galeria?.[activeImg] || sorteo.imagenUrl} iconSize={90} />
              <div className={styles.mainBadge}>
                <Badge estado={sorteo.estado} />
              </div>
              <div className={styles.mainDate}>
                <span>Sorteo</span>
                <strong>{new Date(sorteo.fechaSorteo).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase()}</strong>
                <small>{new Date(sorteo.fechaSorteo).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</small>
              </div>
            </div>
            <div className={styles.thumbs}>
              {(sorteo.galeria && sorteo.galeria.length > 0 ? sorteo.galeria : [1, 2, 3, 4]).map((g, i) => (
                <button
                  key={typeof g === "string" ? g : i}
                  type="button"
                  className={`${styles.thumb} ${activeImg === i ? styles.thumbActive : ""}`}
                  onClick={() => setActiveImg(i)}
                >
                  <PremioImage categoria={sorteo.categoria} src={typeof g === "string" ? g : null} iconSize={22} />
                </button>
              ))}
            </div>
          </div>

          <div className={styles.info}>
            <h1>{sorteo.nombre}</h1>
            {sorteo.rating > 0 && <StarRating rating={sorteo.rating} reviews={sorteo.reviews} />}
            <p className={styles.desc}>{sorteo.descripcion}</p>

            <div className={styles.stats}>
              <div className={styles.stat}>
                <strong>{sorteo.vendidos}</strong>
                <span>Vendidos</span>
              </div>
              <div className={styles.stat}>
                <strong>{sorteo.disponibles}</strong>
                <span>Disponibles</span>
              </div>
              <div className={styles.stat}>
                <strong>{sorteo.total.toLocaleString("es-ES")}</strong>
                <span>Total de boletos</span>
              </div>
              <div className={styles.stat}>
                <strong>{formatMoney(sorteo.precio)}</strong>
                <span>Por boleto</span>
              </div>
            </div>

            {sorteo.estado !== "proximamente" && (
              <div className={styles.progressRow}>
                <div className={styles.progressTrack}>
                  <div className={styles.progressFill} style={{ width: `${pctVendido}%` }} />
                </div>
                <span>{pctVendido}% vendido</span>
              </div>
            )}

            <div className={styles.incluyeBox}>
              <h4>Incluye además</h4>
              <ul>
                {(sorteo.incluye || []).map((item) => (
                  <li key={item}>
                    <Icon name="check" size={15} strokeWidth={2.4} /> {item}
                  </li>
                ))}
              </ul>
            </div>

            {sorteo.estado !== "proximamente" ? (
              <>
                <CountdownTimer target={sorteo.fechaSorteo} />
                <button
                  type="button"
                  className={`btn btn-primary btn-block ${styles.comprarBtn}`}
                  onClick={() => navigate(`/sorteos/${sorteo.id}/paquetes`)}
                >
                  Comprar boletos
                </button>
              </>
            ) : (
              <div className={styles.proximamenteBox}>
                Este sorteo estará disponible muy pronto. ¡Vuelve pronto!
              </div>
            )}
          </div>
        </div>

        {premiados.length > 0 && (
          <div className={styles.premiadosSection}>
            <h2>🎁 ¡Premios Instantáneos!</h2>
            <p>Hay {premiados.length} números premiados con premios extra. Compra tus boletos y revisa si tienes uno de los siguientes números:</p>
            <div className={styles.premiadosGrid}>
              {premiados.map((p) => (
                <div key={p.id} className={styles.premiadoItem}>
                  <span className={`${styles.premiadoNumero} ${p.entregado ? styles.premiadoEntregadoTexto : ""}`}>
                    #{p.numero}
                  </span>
                  <span className={styles.premiadoPremio}>{p.premio}</span>
                  {p.entregado && <span className={styles.premiadoBadge}>¡Premio Entregado!</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
