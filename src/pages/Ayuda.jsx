import { useEffect, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import Icon from "../icons/Icon.jsx";
import { getConfiguracion } from "../services/api.js";
import styles from "./Ayuda.module.css";

const faqs = [
  {
    q: "¿Cómo compro boletos para un sorteo?",
    a: "Es muy sencillo: 1) Elige tu sorteo favorito, 2) Selecciona tu paquete de boletos o ingresa una cantidad personalizada, 3) Completa tus datos de comprador, y 4) Paga con tu método preferido. ¡Tus boletos se generan al instante!",
  },
  {
    q: "¿Cómo sé si mis boletos son legítimos y seguros?",
    a: "Todos nuestros sorteos cuentan con tecnología de generación transparente. Al completar tu compra recibes tu comprobante con tus números únicos asignados que puedes consultar en cualquier momento con tu cédula o correo.",
  },
  {
    q: "¿Cómo se eligen a los ganadores?",
    a: "Los ganadores se determinan mediante sorteos transmitidos en vivo en nuestras redes sociales oficiales utilizando tómbolas digitales auditadas o la Lotería Nacional.",
  },
  {
    q: "¿Cómo me entregan el premio si gano?",
    a: "Nos ponemos en contacto directamente con el ganador vía llamada telefónica y WhatsApp. La entrega del premio se realiza de manera presencial con acta notariada y seguro de transporte.",
  },
  {
    q: "¿Cuáles son los métodos de pago aceptados?",
    a: "Aceptamos Tarjetas de Crédito/Débito (Visa, Mastercard, Diners, American Express, Discover) y Transferencias bancarias directas.",
  },
];

export default function Ayuda() {
  const [openIndex, setOpenIndex] = useState(0);
  const [config, setConfig] = useState(null);

  useEffect(() => {
    getConfiguracion()
      .then(setConfig)
      .catch((err) => console.error("Error cargando configuración:", err));
  }, []);

  const correo = config?.correo || "soporte@eltreboldegaya.com";
  const whatsapp = config?.whatsapp?.replace(/\D/g, "") || "593999999999";
  const instagram = config?.instagram || "https://instagram.com";
  const facebook = config?.facebook || "https://facebook.com";
  const tiktok = config?.tiktok || "https://tiktok.com";
  const politicas = config?.politicas || "";

  const toggleFaq = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="page">
      <Navbar variant="full" />

      <div className={`container ${styles.wrap}`}>
        <div className={styles.header}>
          <h1>Centro de Ayuda y Soporte</h1>
          <p className={styles.subtitle}>
            ¿Tienes alguna duda o necesitas asistencia con tus boletos? Estamos aquí para ayudarte.
          </p>
        </div>

        {/* Tarjetas de contacto rápido */}
        <div className={styles.contactGrid}>
          <a
            href={`https://wa.me/${whatsapp}?text=Hola,%20necesito%20ayuda%20con%20mis%20boletos`}
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.contactCard} ${styles.whatsappCard}`}
          >
            <div className={styles.contactIcon}>
              <Icon name="phone" size={24} />
            </div>
            <div>
              <h3>WhatsApp Soporte</h3>
              <p>Respuesta inmediata 24/7</p>
            </div>
            <span className={styles.cardArrow}>→</span>
          </a>

          <a href={`mailto:${correo}`} className={styles.contactCard}>
            <div className={styles.contactIcon}>
              <Icon name="mail" size={24} />
            </div>
            <div>
              <h3>Correo Electrónico</h3>
              <p>{correo}</p>
            </div>
          </a>

          <div className={styles.contactCard}>
            <div className={styles.contactIcon}>
              <Icon name="shield" size={24} />
            </div>
            <div>
              <h3>Sorteos Verificados</h3>
              <p>Transparencia y seguridad 100%</p>
            </div>
          </div>
        </div>

        {/* FAQ Accordion */}
        <section className={styles.faqSection}>
          <h2>Preguntas Frecuentes</h2>

          <div className={styles.faqList}>
            {faqs.map((faq, i) => (
              <div
                key={faq.q}
                className={`${styles.faqItem} ${openIndex === i ? styles.faqOpen : ""}`}
              >
                <button
                  type="button"
                  className={styles.faqQuestion}
                  onClick={() => toggleFaq(i)}
                >
                  <span>{faq.q}</span>
                  <span className={styles.faqToggle}>{openIndex === i ? "−" : "+"}</span>
                </button>
                {openIndex === i && (
                  <div className={styles.faqAnswer}>
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Términos y Políticas */}
        <section className={styles.faqSection}>
          <h2>Términos y Condiciones / Política de Privacidad</h2>
          {politicas ? (
            <p style={{ whiteSpace: "pre-line" }}>{politicas}</p>
          ) : (
            <p>
              Todos los sorteos son supervisados y auditados. Los boletos son únicos y no reembolsables una vez
              realizado el sorteo. Tus datos personales se usan únicamente para procesar tu compra y contactarte en
              caso de ser ganador.
            </p>
          )}
        </section>

        {/* Redes sociales */}
        <section className={styles.socialSection}>
          <h2>Síguenos en redes sociales</h2>
          <p>Mira los sorteos en vivo y fotos de entregas de premios</p>

          <div className={styles.socialLinks}>
            <a href={instagram} target="_blank" rel="noopener noreferrer" className={styles.socialBtn}>
              Instagram
            </a>
            <a href={facebook} target="_blank" rel="noopener noreferrer" className={styles.socialBtn}>
              Facebook
            </a>
            <a href={tiktok} target="_blank" rel="noopener noreferrer" className={styles.socialBtn}>
              TikTok
            </a>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}
