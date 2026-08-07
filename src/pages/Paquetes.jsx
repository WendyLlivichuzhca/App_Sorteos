import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
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
  const [cantidad, setCantidad] = useState(5);

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

  // Descuento por volumen: tramos reales configurados por el admin (/api/descuentos)
  const tramoAplicable = [...tramos]
    .sort((a, b) => b.cantidad_minima - a.cantidad_minima)
    .find((t) => cantidad >= t.cantidad_minima);
  const ahorra = tramoAplicable ? tramoAplicable.porcentaje : 0;

  const precioBase = cantidad * sorteo.precio;
  const precio = ahorra > 0 ? precioBase * (1 - ahorra / 100) : precioBase;

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
    setCantidad((prev) => Math.max(1, Math.min(500, prev + delta)));
  };

  return (
    <div className="page">
      <Navbar variant="cart" />

      <div className={`container ${styles.wrap}`}>
        <Link to={`/sorteos/${sorteo.id}`} className={styles.volver}>
          <Icon name="chevronLeft" size={16} /> {sorteo.nombre}
        </Link>

        <h1>Elige tu cantidad de boletos</h1>

        <div className={styles.notice}>
          <Icon name="share" size={18} />
          Tus números serán generados aleatoriamente al completar tu compra.
        </div>

        <div className={styles.paquetes}>
          <div className={`${styles.paquete} ${styles.paqueteCustom} ${styles.paqueteActivo}`}>
            <div className={styles.paqueteInfo}>
              <strong>Cantidad de boletos</strong>
              <span className={styles.paqueteBoletos}>
                {ahorra > 0 && <span className={styles.ahorro}>Ahorra {ahorra}%</span>}
              </span>
            </div>

            <div className={styles.counterRow}>
              <button
                type="button"
                className={styles.counterBtn}
                onClick={() => handleCambio(-1)}
                disabled={cantidad <= 1}
              >
                -
              </button>

              <div className={styles.inputWrap}>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={cantidad}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val)) setCantidad(Math.max(1, Math.min(500, val)));
                    else setCantidad(1);
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
          Continuar
        </button>
      </div>
    </div>
  );
}
