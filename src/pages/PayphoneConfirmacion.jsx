import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Icon from "../icons/Icon.jsx";
import { confirmarPagoPayphone } from "../services/api.js";
import { formatMoney } from "../utils/format.js";
import styles from "./CompraExitosa.module.css";

const confettiColors = ["#6d3cf5", "#e63950", "#f5a623", "#16a34a", "#2f6df5"];

// Página de retorno de PayPhone: no depende de AppContext porque el estado en
// memoria del navegador se pierde al ir y volver de un dominio externo. Toda la
// información se obtiene fresca del backend, que a su vez confirma con PayPhone.
export default function PayphoneConfirmacion() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [estado, setEstado] = useState("cargando"); // cargando | aprobado | rechazado | error
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const id = searchParams.get("id");
    const clientTransactionId = searchParams.get("clientTransactionId");

    if (!id || !clientTransactionId) {
      setEstado("error");
      setError("No encontramos información de tu pago. Si ya pagaste, contáctanos con tu código de orden.");
      return;
    }

    confirmarPagoPayphone(id, clientTransactionId)
      .then((data) => {
        setResultado(data.compra);
        setEstado(data.aprobado ? "aprobado" : "rechazado");
      })
      .catch((err) => {
        setEstado("error");
        setError(err.message || "No se pudo confirmar tu pago");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (estado === "cargando") {
    return (
      <div className="page">
        <Navbar variant="cart" />
        <div className={`container ${styles.wrap}`}>
          <div className={styles.card}>
            <h1>Confirmando tu pago...</h1>
            <p className={styles.subtitle}>Un momento, estamos verificando tu pago con PayPhone.</p>
          </div>
        </div>
      </div>
    );
  }

  if (estado === "error" || estado === "rechazado") {
    return (
      <div className="page">
        <Navbar variant="cart" />
        <div className={`container ${styles.wrap}`}>
          <div className={styles.card}>
            <h1>{estado === "rechazado" ? "El pago no se completó" : "Ocurrió un problema"}</h1>
            <p className={styles.subtitle}>
              {estado === "rechazado"
                ? "Tu pago fue cancelado o no se pudo procesar, no se realizó ningún cobro. Tus boletos quedaron liberados."
                : error}
            </p>
            <button type="button" className="btn btn-primary btn-block" onClick={() => navigate("/sorteos")}>
              Volver a intentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <Navbar variant="cart" />
      <div className={`container ${styles.wrap}`}>
        <div className={styles.card}>
          <div className={styles.confetti}>
            {Array.from({ length: 18 }).map((_, i) => (
              <span
                key={i}
                style={{
                  left: `${(i * 53) % 100}%`,
                  background: confettiColors[i % confettiColors.length],
                  animationDelay: `${(i % 6) * 0.2}s`,
                }}
              />
            ))}
          </div>

          <div className={styles.checkWrap}>
            <Icon name="check" size={34} strokeWidth={3} />
          </div>

          <h1>¡Pago aprobado!</h1>
          <p className={styles.subtitle}>Tu pago con tarjeta fue confirmado por PayPhone, ya estás participando.</p>

          <div className={styles.boletosBox}>
            <span>Tus boletos (números aleatorios)</span>
            <strong>{resultado.boletos.map((n) => `#${n}`).join(", ")}</strong>
          </div>

          <div className={styles.detalle}>
            <div className={styles.detalleRow}>
              <span>Sorteo</span>
              <strong>{resultado.sorteoNombre}</strong>
            </div>
            <div className={styles.detalleRow}>
              <span>Código de orden</span>
              <strong>{resultado.codigo}</strong>
            </div>
            <div className={styles.detalleRow}>
              <span>Total pagado</span>
              <strong>{formatMoney(resultado.total)}</strong>
            </div>
          </div>

          <div className={styles.acciones}>
            <button type="button" className="btn btn-primary btn-block" onClick={() => navigate("/consultar-boletos")}>
              Ver mis boletos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
