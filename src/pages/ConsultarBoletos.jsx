import React, { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Badge from "../components/Badge.jsx";
import PremioImage from "../components/PremioImage.jsx";
import Icon from "../icons/Icon.jsx";
import { buscarBoletosPorCedula } from "../services/api.js";
import { formatDate, formatMoney } from "../utils/format.js";
import styles from "./ConsultarBoletos.module.css";

export default function ConsultarBoletos() {
  const [cedula, setCedula] = useState("");
  const [compras, setCompras] = useState([]);
  const [buscado, setBuscado] = useState(false);
  const [cargando, setCargando] = useState(false);

  const handleBuscar = async (e) => {
    e.preventDefault();
    if (!cedula.trim()) return;

    try {
      setCargando(true);
      const data = await buscarBoletosPorCedula(cedula.trim());
      setCompras(data);
      setBuscado(true);
      setCargando(false);
    } catch (err) {
      console.error("Error al buscar boletos:", err);
      setCargando(false);
    }
  };

  return (
    <div className="page">
      <Navbar variant="cart" />

      <div className={`container ${styles.wrap}`}>
        <div className={styles.card}>
          <h1>Consultar mis boletos</h1>
          <p className={styles.subtitle}>Ingresa tu número de cédula para consultar tus boletos asignados</p>

          <form onSubmit={handleBuscar} className={styles.form}>
            <div className={styles.inputWrap}>
              <Icon name="search" size={18} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Ej. 1712345678"
                value={cedula}
                onChange={(e) => setCedula(e.target.value)}
                className={styles.input}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={cargando}>
              {cargando ? "Buscando..." : "Buscar boletos"}
            </button>
          </form>

          {buscado && (
            <div className={styles.resultados}>
              {compras.length === 0 ? (
                <div className={styles.sinResultados}>
                  <Icon name="search" size={40} />
                  <h3>No encontramos boletos</h3>
                  <p>No existen compras registradas asociadas al número de cédula <strong>{cedula}</strong>.</p>
                </div>
              ) : (
                <div className={styles.listaCompras}>
                  {compras.map((c) => (
                    <div key={c.id} className={styles.compraCard}>
                      <div className={styles.compraHeader}>
                        <span className={styles.compraCodigo}>{c.codigo}</span>
                        <Badge variant={c.estado === "aprobado" ? "activo" : c.estado === "pendiente" ? "proximamente" : "agotado"}>
                          {c.estado === "aprobado" ? "Aprobado / Boletos Activos" : c.estado === "pendiente" ? "Pendiente de Verificación" : "Rechazado"}
                        </Badge>
                      </div>
                      <h4 className={styles.compraNombre}>{c.sorteoNombre}</h4>
                      <p className={styles.compraMeta}>Total pagado: {formatMoney(c.totalPagado)} ({c.cantidadBoletos} boletos)</p>

                      <div className={styles.boletosBox}>
                        <span className={styles.boletosBoxLabel}>Números de Boletos Asignados:</span>
                        <div className={styles.boletosChips}>
                          {(c.boletosAsignados || []).map((num, idx) => (
                            <span key={idx} className={styles.boletoChip}>
                              #{num}
                            </span>
                          ))}
                        </div>
                      </div>
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
