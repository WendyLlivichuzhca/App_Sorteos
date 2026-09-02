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

  const getDescuentoParaCantidad = (numBoletos) => {
    const tramo = [...tramos]
      .sort((a, b) => b.cantidad_minima - a.cantidad_minima)
      .find((t) => numBoletos >= t.cantidad_minima);
    return tramo ? tramo.porcentaje : 0;
  };

  const ahorra = getDescuentoParaCantidad(cantidad);
  const precioBase = cantidad * sorteo.precio;
  const precio = ahorra > 0 ? precioBase * (1 - ahorra / 100) : precioBase;

  // Paquetes predefinidos estándar (sus descuentos se calculan dinámicamente del panel admin)
  const paquetesPreset = [
    { id: "basico", nombre: "Paquete Básico", boletos: 1 },
    { id: "popular", nombre: "Paquete Popular", boletos: 5, popular: true },
    { id: "vip", nombre: "Paquete VIP", boletos: 10 },
    { id: "premium", nombre: "Paquete Premium", boletos: 20 },
  ];

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

  const seleccionarPreset = (numBoletos) => {
    setCantidad(numBoletos);
  };

  return (
    <div className="page">
      <Navbar variant="cart" />

      <div className={`container ${styles.wrap}`}>
        <Link to={`/sorteos/${sorteo.id}`} className={styles.volver}>
          <Icon name="chevronLeft" size={16} /> {sorteo.nombre}
        </Link>

        <h1>Elige tu paquete o cantidad de boletos</h1>

        <div className={styles.notice}>
          <Icon name="share" size={18} />
          Tus números serán generados aleatoriamente al completar tu compra.
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
                  <strong>{p.nombre}</strong>
                  <span className={styles.paqueteBoletos}>
                    {p.boletos} {p.boletos === 1 ? "Boleto" : "Boletos"}
                    {porcentajeAhorro > 0 && <span className={styles.ahorro}>Ahorra {porcentajeAhorro}%</span>}
                  </span>
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

      <Footer />
    </div>
  );
}
