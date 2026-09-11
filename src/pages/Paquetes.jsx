import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import Icon from "../icons/Icon.jsx";
import { useApp } from "../context/AppContext.jsx";
import { getSorteoById, getDescuentos } from "../services/api.js";
import { formatMoney } from "../utils/format.js";
import styles from "./Paquetes.module.css";

export default function Paquetes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { elegirPaquete } = useApp();
  const [sorteo, setSorteo] = useState(null);
  const [tramos, setTramos] = useState([]);
  const [loading, setLoading] = useState(true);
  const CANTIDAD_MINIMA = 10;
  const [cantidad, setCantidad] = useState(CANTIDAD_MINIMA);

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
    getDescuentos()
      .then(setTramos)
      .catch((err) => console.error("Error cargando descuentos:", err));
  }, [id]);

  if (loading) {
    return (
      <div className="page">
        <Navbar variant="cart" />
        <div className="container">Cargando...</div>
      </div>
    );
  }

  if (!sorteo) {
    return (
      <div className="page">
        <Navbar variant="cart" />
        <div className={`container ${styles.wrap}`}>
          <p>No encontramos este sorteo.</p>
          <Link to="/sorteos" className="btn btn-primary">Volver a sorteos</Link>
        </div>
      </div>
    );
  }

  const getDescuentoParaCantidad = (numBoletos) => {
    const tramo = [...tramos]
      .sort((a, b) => b.cantidad_minima - a.cantidad_minima)
      .find((t) => numBoletos >= t.cantidad_minima);
    return tramo ? tramo.porcentaje : 0;
  };

  const ahorra = getDescuentoParaCantidad(cantidad);
  const precioBase = cantidad * sorteo.precio;
  const precio = ahorra > 0 ? precioBase * (1 - ahorra / 100) : precioBase;

  // Las tarjetas de paquete se generan directo de los tramos de Descuentos por Volumen
  // (panel admin): cada tramo "desde X boletos" se muestra como un paquete de X boletos.
  // Así, crear/editar/borrar un tramo ahí actualiza esta pantalla sin tocar código.
  const paquetesPreset = [...tramos]
    .sort((a, b) => a.cantidad_minima - b.cantidad_minima)
    .map((t) => ({ id: `tramo-${t.id}`, boletos: t.cantidad_minima }));

  const paquete = {
    nombre: "Selección de boletos",
    boletos: cantidad,
    precio: Number(precio.toFixed(2)),
    ahorra,
  };

  const continuar = () => {
    elegirPaquete(sorteo, paquete);
    navigate("/checkout/datos");
  };

  const handleCambio = (delta) => {
    setCantidad((prev) => Math.max(CANTIDAD_MINIMA, Math.min(500, prev + delta)));
  };

  const seleccionarPreset = (numBoletos) => {
    setCantidad(numBoletos);
  };

  return (
    <div className="page">
      <Navbar variant="cart" />

      <div className={styles.decorWrap}>
        <div className={`${styles.blob} ${styles.blob1}`} />
        <div className={`${styles.blob} ${styles.blob2}`} />
        <svg className={`${styles.leaf} ${styles.leaf1}`} viewBox="0 0 100 100" fill="none" aria-hidden="true"><path fill="currentColor" d="M50 5C25 15 10 40 15 65C20 88 45 98 68 90C88 83 95 60 85 40C75 20 60 8 50 5Z" /></svg>
        <svg className={`${styles.leaf} ${styles.leaf2}`} viewBox="0 0 100 100" fill="none" aria-hidden="true"><path fill="currentColor" d="M50 5C25 15 10 40 15 65C20 88 45 98 68 90C88 83 95 60 85 40C75 20 60 8 50 5Z" /></svg>
        <svg className={`${styles.leaf} ${styles.leaf3}`} viewBox="0 0 100 100" fill="none" aria-hidden="true"><path fill="currentColor" d="M50 5C25 15 10 40 15 65C20 88 45 98 68 90C88 83 95 60 85 40C75 20 60 8 50 5Z" /></svg>

      <div className={`container ${styles.wrap}`}>
        <Link to={`/sorteos/${sorteo.id}`} className={styles.volver}>
          <Icon name="chevronLeft" size={16} /> {sorteo.nombre}
        </Link>

        <h1>Elige tu paquete o cantidad de boletos</h1>

        <div className={styles.notice}>
          <Icon name="badgeCheck" size={18} />
          Tus números serán generados aleatoriamente al completar tu compra. Compra mínima: {CANTIDAD_MINIMA} boletos.
        </div>

        <div className={styles.paquetes}>
          {/* Tarjetas de Paquetes Predefinidos (Foto 1) */}
          {paquetesPreset.map((p) => {
            const porcentajeAhorro = getDescuentoParaCantidad(p.boletos);
            const precioPresetBase = p.boletos * sorteo.precio;
            const precioPreset = porcentajeAhorro > 0 ? precioPresetBase * (1 - porcentajeAhorro / 100) : precioPresetBase;
            const esActivo = cantidad === p.boletos;

            return (
              <button
                key={p.id}
                type="button"
                className={`${styles.paquete} ${esActivo ? styles.paqueteActivo : ""}`}
                onClick={() => seleccionarPreset(p.boletos)}
              >
                <span className={styles.radio}>
                  {esActivo && <span className={styles.radioDot} />}
                </span>
                <div className={styles.paqueteInfo}>
                  <strong>{p.boletos} {p.boletos === 1 ? "Boleto" : "Boletos"}</strong>
                  {porcentajeAhorro > 0 && (
                    <span className={styles.paqueteBoletos}>
                      <span className={styles.ahorro}>Ahorra {porcentajeAhorro}%</span>
                    </span>
                  )}
                </div>
                <span className={styles.paquetePrecio}>
                  {formatMoney(precioPreset)}
                </span>
              </button>
            );
          })}

          {/* Opción Personalizada con contador + y - (Foto 2) */}
          <div className={`${styles.paquete} ${styles.paqueteCustom} ${!paquetesPreset.some(p => p.boletos === cantidad) ? styles.paqueteActivo : ""}`}>
            <div className={styles.customHeaderBtn} style={{ padding: "14px 20px" }}>
              <span className={styles.radio}>
                {!paquetesPreset.some(p => p.boletos === cantidad) && <span className={styles.radioDot} />}
              </span>
              <div className={styles.paqueteInfo}>
                <strong>Cantidad personalizada</strong>
                <span className={styles.paqueteBoletos}>
                  Elige la cantidad exacta que desees
                  {ahorra > 0 && <span className={styles.ahorro}>Ahorra {ahorra}%</span>}
                </span>
              </div>
            </div>

            <div className={styles.counterRow}>
              <button
                type="button"
                className={styles.counterBtn}
                onClick={() => handleCambio(-1)}
                disabled={cantidad <= CANTIDAD_MINIMA}
              >
                -
              </button>

              <div className={styles.inputWrap}>
                <input
                  type="number"
                  min={CANTIDAD_MINIMA}
                  max="500"
                  value={cantidad}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val)) setCantidad(Math.max(CANTIDAD_MINIMA, Math.min(500, val)));
                    else setCantidad(CANTIDAD_MINIMA);
                  }}
                  className={styles.counterInput}
                />
                <span className={styles.inputLabel}>Boletos</span>
              </div>

              <button
                type="button"
                className={styles.counterBtn}
                onClick={() => handleCambio(1)}
                disabled={cantidad >= 500}
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className={styles.totalBox}>
          <span>Total a pagar ({paquete.boletos} {paquete.boletos === 1 ? "boleto" : "boletos"})</span>
          <strong>{formatMoney(paquete.precio)}</strong>
        </div>

        <button type="button" className={`btn btn-primary btn-block ${styles.continuarBtn}`} onClick={continuar}>
          <Icon name="ticket" size={17} /> Continuar <Icon name="arrowRight" size={16} />
        </button>
      </div>
      </div>

      <Footer />
    </div>
  );
}
