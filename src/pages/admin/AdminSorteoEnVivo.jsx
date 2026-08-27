import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Icon from "../../icons/Icon.jsx";
import { getSorteos, getBoletosAdmin, sortearGanador } from "../../services/api.js";
import styles from "./AdminSorteoEnVivo.module.css";

const confettiColors = ["#ffffff", "#f5c518", "#22d3ee", "#a78bfa", "#4ade80"];

// Genera una secuencia de pausas crecientes para el efecto de "máquina tragamonedas":
// rápido al inicio, cada vez más lento, como si el número se fuera frenando solo.
const PAUSAS = [55, 55, 60, 65, 70, 80, 90, 105, 120, 140, 165, 195, 230, 270, 320, 380, 450, 540, 650, 780];

function animarNumeros(pool, setNumero) {
  return new Promise((resolve) => {
    let i = 0;
    const paso = () => {
      setNumero(pool[Math.floor(Math.random() * pool.length)]);
      if (i < PAUSAS.length - 1) {
        i += 1;
        setTimeout(paso, PAUSAS[i]);
      } else {
        resolve();
      }
    };
    paso();
  });
}

export default function AdminSorteoEnVivo() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [sorteos, setSorteos] = useState([]);
  const [sorteoId, setSorteoId] = useState(searchParams.get("sorteo") || "");
  const [vendidos, setVendidos] = useState([]);
  const [numeroMostrado, setNumeroMostrado] = useState("----");
  const [estado, setEstado] = useState("idle"); // idle | girando | revelado
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getSorteos()
      .then((data) => {
        setSorteos(data);
        if (!sorteoId) {
          const elegible = data.find((s) => s.estado !== "finalizado" && s.vendidos > 0);
          if (elegible) setSorteoId(String(elegible.id));
        }
      })
      .catch((err) => console.error("Error cargando sorteos:", err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!sorteoId) return;
    setSearchParams({ sorteo: sorteoId }, { replace: true });
    getBoletosAdmin(sorteoId)
      .then((data) => setVendidos(data.filter((b) => b.estado === "vendido").map((b) => b.numero)))
      .catch((err) => console.error("Error cargando boletos:", err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sorteoId]);

  const sorteoActual = sorteos.find((s) => String(s.id) === sorteoId);
  const puedeSortear = sorteoActual && sorteoActual.estado !== "finalizado" && vendidos.length > 0;

  const iniciarSorteo = async () => {
    if (!puedeSortear || estado === "girando") return;
    setError("");
    setResultado(null);
    setEstado("girando");
    try {
      const [data] = await Promise.all([sortearGanador(sorteoId), animarNumeros(vendidos, setNumeroMostrado)]);
      setNumeroMostrado(data.boletoNumero);
      setResultado(data);
      setEstado("revelado");
    } catch (err) {
      setError(err.message || "No se pudo realizar el sorteo");
      setEstado("idle");
    }
  };

  return (
    <div className={styles.page}>
      <Link to="/admin/ganadores" className={styles.salir}>
        <Icon name="chevronLeft" size={16} /> Salir
      </Link>

      {estado !== "revelado" && (
        <div className={styles.picker}>
          <select
            className={styles.select}
            value={sorteoId}
            onChange={(e) => {
              setSorteoId(e.target.value);
              setEstado("idle");
              setResultado(null);
              setNumeroMostrado("----");
            }}
            disabled={estado === "girando"}
          >
            {sorteos.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre} {s.estado === "finalizado" ? "(finalizado)" : `— ${s.vendidos} vendidos`}
              </option>
            ))}
          </select>
        </div>
      )}

      {estado !== "revelado" && sorteoActual && (
        <>
          <p className={styles.eyebrow}>Sorteo en vivo</p>
          <h1 className={styles.sorteoNombre}>{sorteoActual.nombre}</h1>

          <div className={`${styles.numeroWrap} ${estado === "girando" ? styles.girando : ""}`}>
            <span className={styles.hash}>#</span>
            <span className={styles.numero}>{numeroMostrado}</span>
          </div>

          {!puedeSortear && sorteoActual.estado === "finalizado" && (
            <p className={styles.aviso}>Este sorteo ya tiene ganador.</p>
          )}
          {!puedeSortear && sorteoActual.estado !== "finalizado" && (
            <p className={styles.aviso}>Este sorteo todavía no tiene boletos vendidos.</p>
          )}
          {error && <p className={styles.error}>⚠️ {error}</p>}

          <button
            type="button"
            className={styles.botonSortear}
            onClick={iniciarSorteo}
            disabled={!puedeSortear || estado === "girando"}
          >
            {estado === "girando" ? "Sorteando..." : "🎉 Iniciar Sorteo"}
          </button>
        </>
      )}

      {estado === "revelado" && resultado && (
        <div className={styles.revelado}>
          <div className={styles.confetti}>
            {Array.from({ length: 40 }).map((_, i) => (
              <span
                key={i}
                style={{
                  left: `${(i * 37) % 100}%`,
                  background: confettiColors[i % confettiColors.length],
                  animationDelay: `${(i % 10) * 0.25}s`,
                  animationDuration: `${2.6 + (i % 5) * 0.4}s`,
                }}
              />
            ))}
          </div>

          <p className={styles.eyebrowLight}>🏆 Ganador del sorteo</p>
          <h1 className={styles.sorteoNombreLight}>{resultado.sorteoNombre}</h1>

          <div className={styles.numeroWrapFinal}>
            <span className={styles.hashFinal}>#</span>
            <span className={styles.numeroFinal}>{resultado.boletoNumero}</span>
          </div>

          <p className={styles.ganadorNombre}>{resultado.clienteNombre}</p>

          <div className={styles.accionesFinal}>
            <button
              type="button"
              className={styles.botonOtraVez}
              onClick={() => {
                setEstado("idle");
                setResultado(null);
                setNumeroMostrado("----");
              }}
            >
              Ver otro sorteo
            </button>
            <Link to="/admin/ganadores" className={styles.botonPanel}>
              Volver al panel
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
