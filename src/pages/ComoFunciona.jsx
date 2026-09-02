import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import Icon from "../icons/Icon.jsx";
import styles from "./ComoFunciona.module.css";

const pasos = [
  {
    icon: "search",
    titulo: "Elige tu sorteo",
    texto:
      "Explora todos los sorteos activos: autos, motos, tecnología, efectivo, casas y más. Cada sorteo muestra el premio, el precio por boleto y cuántos boletos ya se vendieron.",
  },
  {
    icon: "box",
    titulo: "Selecciona tus boletos",
    texto:
      "Elige uno de nuestros paquetes con descuento o ingresa la cantidad exacta que quieras. Mientras más boletos compres, más ahorras.",
  },
  {
    icon: "id",
    titulo: "Completa tus datos y paga",
    texto:
      "Ingresa tus datos de contacto y elige tu método de pago preferido: transferencia bancaria o tarjeta de crédito/débito.",
  },
  {
    icon: "ticket",
    titulo: "Recibe tus boletos al instante",
    texto:
      "Apenas confirmes tu compra, se generan tus números al azar. Puedes consultarlos cuando quieras con tu cédula o correo.",
  },
  {
    icon: "award",
    titulo: "Espera el sorteo en vivo",
    texto:
      "Transmitimos los sorteos en vivo por nuestras redes sociales. Si ganas, te contactamos de inmediato para coordinar la entrega.",
  },
];

const confianza = [
  { icon: "shield", title: "Compra segura", text: "Tus pagos están protegidos" },
  { icon: "badgeCheck", title: "Sorteos verificados", text: "Transparencia y confianza en cada sorteo" },
  { icon: "users", title: "Ganadores reales", text: "Miles de personas ya han ganado" },
];

export default function ComoFunciona() {
  const navigate = useNavigate();

  return (
    <div className="page">
      <Navbar variant="full" />

      <section className={styles.hero}>
        <div className={`container ${styles.heroInner}`}>
          <span className={styles.heroTag}>Guía rápida</span>
          <h1>¿Cómo funciona?</h1>
          <p>Comprar tus boletos toma menos de un minuto. Así de simple es participar.</p>
        </div>
      </section>

      <div className={`container ${styles.wrap}`}>
        <div className={styles.timeline}>
          {pasos.map((p, i) => (
            <div key={p.titulo} className={styles.pasoRow}>
              <div className={styles.pasoMarker}>
                <span className={styles.pasoNumero}>{i + 1}</span>
                {i < pasos.length - 1 && <span className={styles.pasoLinea} />}
              </div>
              <div className={styles.pasoCard}>
                <span className={styles.pasoIcon}>
                  <Icon name={p.icon} size={24} strokeWidth={1.6} />
                </span>
                <div>
                  <h3>{p.titulo}</h3>
                  <p>{p.texto}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.confianzaGrid}>
          {confianza.map((f) => (
            <div key={f.title} className={styles.confianzaCard}>
              <span className={styles.confianzaIcon}>
                <Icon name={f.icon} size={22} strokeWidth={1.6} />
              </span>
              <div>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.ctaBox}>
          <h2>¿Listo para participar?</h2>
          <p>Elige tu sorteo favorito y consigue tus boletos en segundos.</p>
          <button type="button" className={styles.ctaBtn} onClick={() => navigate("/sorteos")}>
            Ver sorteos disponibles&nbsp;&nbsp;→
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
