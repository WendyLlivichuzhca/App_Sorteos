import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Badge from "../components/Badge.jsx";
import PremioImage from "../components/PremioImage.jsx";
import Icon from "../icons/Icon.jsx";
import { useApp } from "../context/AppContext.jsx";
import { formatDate } from "../utils/format.js";
import styles from "./ConsultarBoletos.module.css";

const TABS = [
  { id: "correo", label: "Por correo" },
  { id: "compra", label: "Por número de compra" },
  { id: "cedula", label: "Por cédula" },
];

export default function ConsultarBoletos() {
  const { orders } = useApp();
  const [tab, setTab] = useState("correo");
  const [valor, setValor] = useState("");
  const [buscado, setBuscado] = useState(false);
  const [resultados, setResultados] = useState([]);

  const placeholders = {
    correo: "Ej. juanperez@gmail.com",
    compra: "Ej. TCK-12345678",
    cedula: "Ej. 1712345678",
  };

  const buscar = (e) => {
    e.preventDefault();
    const v = valor.trim().toLowerCase();
    const encontrados = orders.filter((o) => {
      if (tab === "correo") return o.comprador.correo.toLowerCase() === v;
      if (tab === "compra") return o.numeroCompra.toLowerCase() === v;
      return o.comprador.cedula.toLowerCase() === v;
    });
    setResultados(encontrados);
    setBuscado(true);
  };

  return (
    <div className="page">
      <Navbar variant="cart" />

      <div className={`container ${styles.wrap}`}>
        <div className={styles.card}>
          <h1>Consultar mis boletos</h1>
          <p className={styles.subtitle}>Ingresa uno de los siguientes datos para ver tus boletos</p>

          <div className={styles.tabs}>
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`${styles.tab} ${tab === t.id ? styles.tabActivo : ""}`}
                onClick={() => {
                  setTab(t.id);
                  setBuscado(false);
                  setValor("");
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          <form onSubmit={buscar}>
            <label className={styles.field}>
              <span>{TABS.find((t) => t.id === tab)?.label}</span>
              <input
                type="text"
                placeholder={placeholders[tab]}
                value={valor}
                onChange={(e) => setValor(e.target.value)}
              />
            </label>

            <button type="submit" className={`btn btn-primary btn-block ${styles.buscarBtn}`}>
              <Icon name="search" size={17} /> Buscar
            </button>
          </form>

          {buscado && (
            <div className={styles.resultados}>
              <h4>Resultado de la búsqueda</h4>

              {resultados.length === 0 ? (
                <p className={styles.sinResultados}>
                  No encontramos boletos con ese dato. Verifica la información e intenta nuevamente.
                </p>
              ) : (
                <div className={styles.lista}>
                  {resultados.map((o) => (
                    <div key={o.numeroCompra} className={styles.resultado}>
                      <div className={styles.resultadoTop}>
                        <Badge estado={o.sorteo.estado} />
                      </div>
                      <div className={styles.resultadoBody}>
                        <div className={styles.resultadoImg}>
                          <PremioImage categoria={o.sorteo.categoria} iconSize={26} />
                        </div>
                        <div className={styles.resultadoInfo}>
                          <strong>{o.sorteo.nombre}</strong>
                          <span>Sorteo: {formatDate(o.sorteo.fechaSorteo)}</span>
                        </div>
                        <div className={styles.resultadoDatos}>
                          <span>Paquete</span>
                          <strong>{o.paquete.nombre} ({o.paquete.boletos})</strong>
                        </div>
                        <div className={styles.resultadoDatos}>
                          <span>Estado</span>
                          <strong className={styles.estadoActivo}>Activo</strong>
                        </div>
                        <div className={styles.resultadoDatos}>
                          <span>Tus boletos</span>
                          <strong className={styles.numeroBoleto}>{o.numeroBoleto}</strong>
                        </div>
                      </div>
                      <Link to={`/sorteos/${o.sorteo.id}`} className={styles.verDetalle}>
                        Ver detalle del sorteo <Icon name="arrowRight" size={15} />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
