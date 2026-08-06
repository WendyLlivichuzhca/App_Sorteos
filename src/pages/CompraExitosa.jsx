import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Icon from "../icons/Icon.jsx";
import { useApp } from "../context/AppContext.jsx";
import { metodosPago } from "../data/sorteos.js";
import { formatDate, formatMoney } from "../utils/format.js";
import styles from "./CompraExitosa.module.css";

const confettiColors = ["#6d3cf5", "#e63950", "#f5a623", "#16a34a", "#2f6df5"];

export default function CompraExitosa() {
  const navigate = useNavigate();
  const { ultimaCompra, reiniciarFlujo } = useApp();

  useEffect(() => {
    if (!ultimaCompra) navigate("/sorteos", { replace: true });
  }, [ultimaCompra, navigate]);

  if (!ultimaCompra) return null;

  const metodo = metodosPago.find((m) => m.id === ultimaCompra.metodoPago);

  const descargarComprobante = () => {
    const contenido = `SORTEOS EN LÍNEA - Comprobante de compra
Número de compra: ${ultimaCompra.numeroCompra}
Boleto: ${ultimaCompra.numeroBoleto}
Sorteo: ${ultimaCompra.sorteo.nombre}
Paquete: ${ultimaCompra.paquete.nombre} (${ultimaCompra.paquete.boletos} boletos)
Total pagado: ${formatMoney(ultimaCompra.total)}
Fecha: ${formatDate(ultimaCompra.fecha)}
Método de pago: ${metodo?.nombre || ""}
Comprador: ${ultimaCompra.comprador.nombre}
`;
    const blob = new Blob([contenido], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `comprobante-${ultimaCompra.numeroCompra}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const compartir = async () => {
    const texto = `¡Ya estoy participando en el sorteo de ${ultimaCompra.sorteo.nombre} en SORTEOS EN LÍNEA! Mi boleto: ${ultimaCompra.numeroBoleto}`;
    if (navigator.share) {
      try {
        await navigator.share({ text: texto, title: "SORTEOS EN LÍNEA" });
      } catch {
        // usuario canceló, no hacer nada
      }
    } else {
      const waUrl = `https://wa.me/?text=${encodeURIComponent(texto)}`;
      window.open(waUrl, "_blank");
    }
  };

  const irAConsultarBoletos = () => navigate("/consultar-boletos");

  const finalizarFlujo = (destino) => {
    reiniciarFlujo();
    navigate(destino);
  };

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

          <h1>¡Compra realizada con éxito!</h1>
          <p className={styles.subtitle}>Gracias por tu compra, ya estás participando.</p>

          <div className={styles.boletosBox}>
            <span>Tus boletos (número aleatorio)</span>
            <strong>{ultimaCompra.numeroBoleto}</strong>
          </div>

          <div className={styles.detalle}>
            <div className={styles.detalleRow}>
              <span>Sorteo</span>
              <strong>{ultimaCompra.sorteo.nombre}</strong>
            </div>
            <div className={styles.detalleRow}>
              <span>Paquete</span>
              <strong>{ultimaCompra.paquete.nombre} ({ultimaCompra.paquete.boletos} boleto{ultimaCompra.paquete.boletos > 1 ? "s" : ""})</strong>
            </div>
            <div className={styles.detalleRow}>
              <span>Total pagado</span>
              <strong>{formatMoney(ultimaCompra.total)}</strong>
            </div>
            <div className={styles.detalleRow}>
              <span>Fecha</span>
              <strong>{formatDate(ultimaCompra.fecha)}</strong>
            </div>
            <div className={styles.detalleRow}>
              <span>Método de pago</span>
              <strong>{metodo?.nombre}</strong>
            </div>
          </div>

          <div className={styles.acciones}>
            <div className={styles.accionesFila}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={descargarComprobante}>
                <Icon name="download" size={16} /> Descargar comprobante
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={compartir}>
                <Icon name="share" size={16} /> Compartir
              </button>
            </div>
            <button type="button" className="btn btn-primary btn-block" onClick={irAConsultarBoletos}>
              Ver mis boletos
            </button>
          </div>

          <div className={styles.cuentaBox}>
            <p>¿Quieres administrar tus compras y participar en más sorteos?</p>
            <div className={styles.cuentaAcciones}>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => finalizarFlujo("/")}>
                Crear cuenta
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => finalizarFlujo("/sorteos")}>
                Más tarde
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
