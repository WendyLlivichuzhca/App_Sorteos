import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Icon from "../icons/Icon.jsx";
import { useApp } from "../context/AppContext.jsx";
import { getSorteoById } from "../data/sorteos.js";
import { formatMoney } from "../utils/format.js";
import styles from "./Paquetes.module.css";

export default function Paquetes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { elegirPaquete } = useApp();
  const sorteo = getSorteoById(id);
  const [seleccionado, setSeleccionado] = useState(sorteo?.paquetes[0]?.id);
  const [customCantidad, setCustomCantidad] = useState(15);

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

  // Calcular precio y descuento para cantidad personalizada
  let customAhorra = 0;
  if (customCantidad >= 20) customAhorra = 30;
  else if (customCantidad >= 10) customAhorra = 20;
  else if (customCantidad >= 5) customAhorra = 10;

  const customPrecioBase = customCantidad * sorteo.precio;
  const customPrecio = customAhorra > 0 ? customPrecioBase * (1 - customAhorra / 100) : customPrecioBase;

  const isCustom = seleccionado === "custom";
  const paquete = isCustom
    ? {
        id: "custom",
        nombre: "Cantidad personalizada",
        boletos: customCantidad,
        precio: Number(customPrecio.toFixed(2)),
        ahorra: customAhorra,
      }
    : sorteo.paquetes.find((p) => p.id === seleccionado);

  const continuar = () => {
    elegirPaquete(sorteo, paquete);
    navigate("/checkout/datos");
  };

  const handleCustomChange = (delta) => {
    setCustomCantidad((prev) => Math.max(1, Math.min(500, prev + delta)));
  };

  return (
    <div className="page">
      <Navbar variant="cart" />

      <div className={`container ${styles.wrap}`}>
        <Link to={`/sorteos/${sorteo.id}`} className={styles.volver}>
          <Icon name="chevronLeft" size={16} /> {sorteo.nombre}
        </Link>

        <h1>Elige tu paquete de boletos</h1>

        <div className={styles.notice}>
          <Icon name="share" size={18} />
          Tus números serán generados aleatoriamente al completar tu compra.
        </div>

        <div className={styles.paquetes}>
          {sorteo.paquetes.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`${styles.paquete} ${seleccionado === p.id ? styles.paqueteActivo : ""}`}
              onClick={() => setSeleccionado(p.id)}
            >
              <span className={styles.radio}>
                {seleccionado === p.id && <span className={styles.radioDot} />}
              </span>
              <span className={styles.paqueteInfo}>
                <strong>{p.nombre}</strong>
                <span className={styles.paqueteBoletos}>
                  {p.boletos} {p.boletos === 1 ? "Boleto" : "Boletos"}
                  {p.ahorra > 0 && <span className={styles.ahorro}>Ahorra {p.ahorra}%</span>}
                </span>
              </span>
              <span className={styles.paquetePrecio}>{formatMoney(p.precio)}</span>
            </button>
          ))}

          {/* Opción de cantidad personalizada */}
          <div className={`${styles.paquete} ${styles.paqueteCustom} ${isCustom ? styles.paqueteActivo : ""}`}>
            <button
              type="button"
              className={styles.customHeaderBtn}
              onClick={() => setSeleccionado("custom")}
            >
              <span className={styles.radio}>
                {isCustom && <span className={styles.radioDot} />}
              </span>
              <span className={styles.paqueteInfo}>
                <strong>Elegir cantidad personalizada</strong>
                <span className={styles.paqueteBoletos}>
                  Ingresa cualquier cantidad de boletos
                  {customAhorra > 0 && <span className={styles.ahorro}>Ahorra {customAhorra}%</span>}
                </span>
              </span>
              <span className={styles.paquetePrecio}>{formatMoney(customPrecio)}</span>
            </button>

            {isCustom && (
              <div className={styles.counterRow}>
                <button
                  type="button"
                  className={styles.counterBtn}
                  onClick={() => handleCustomChange(-1)}
                  disabled={customCantidad <= 1}
                >
                  -
                </button>

                <div className={styles.inputWrap}>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={customCantidad}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val)) setCustomCantidad(Math.max(1, Math.min(500, val)));
                      else setCustomCantidad(1);
                    }}
                    className={styles.counterInput}
                  />
                  <span className={styles.inputLabel}>Boletos</span>
                </div>

                <button
                  type="button"
                  className={styles.counterBtn}
                  onClick={() => handleCustomChange(1)}
                  disabled={customCantidad >= 500}
                >
                  +
                </button>
              </div>
            )}
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
