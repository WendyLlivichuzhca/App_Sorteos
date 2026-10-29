import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import { getConfiguracion } from "../services/api.js";
import styles from "./Privacidad.module.css";

const ULTIMA_ACTUALIZACION = "29 de octubre de 2026";

export default function Privacidad() {
  const [config, setConfig] = useState(null);

  useEffect(() => {
    getConfiguracion()
      .then(setConfig)
      .catch((err) => console.error("Error cargando configuración:", err));
  }, []);

  const empresa = config?.nombre_empresa || "El Trébol de Gaya";
  const correo = config?.correo || "soporte@eltreboldegaya.com";

  return (
    <div className="page">
      <Navbar variant="full" />

      <div className={`container ${styles.wrap}`}>
        <header className={styles.header}>
          <h1>Política de privacidad</h1>
          <p className={styles.actualizacion}>Última actualización: {ULTIMA_ACTUALIZACION}</p>
          <p className={styles.intro}>
            En {empresa} cuidamos tus datos personales. Aquí te explicamos, de forma sencilla, qué información
            recopilamos cuando visitas este sitio o compras boletos, para qué la usamos y cuáles son tus derechos.
          </p>
        </header>

        <article className={styles.contenido}>
          <section>
            <h2>1. Quién es el responsable</h2>
            <p>
              El responsable del tratamiento de tus datos es <strong>{empresa}</strong>. Puedes escribirnos para
              cualquier consulta sobre esta política a{" "}
              <a href={`mailto:${correo}`}>{correo}</a>.
            </p>
          </section>

          <section>
            <h2>2. Qué datos recopilamos</h2>
            <p>Cuando compras boletos, te pedimos:</p>
            <ul>
              <li>Tipo y número de documento (cédula, RUC o pasaporte).</li>
              <li>Nombres y apellidos.</li>
              <li>Correo electrónico y número de teléfono.</li>
              <li>Dirección, país, provincia y ciudad.</li>
              <li>El comprobante de pago, si pagas por transferencia o código QR.</li>
            </ul>
            <p>
              También guardamos el registro de tus compras y de los números de boleto que se te asignan. Si aceptas
              las cookies, además se registran datos técnicos de tu visita, como las páginas que ves y el tipo de
              navegador.
            </p>
            <p>
              <strong>No guardamos los datos de tu tarjeta.</strong> El pago con tarjeta se realiza en la plataforma
              de PayPhone, que los procesa directamente.
            </p>
          </section>

          <section>
            <h2>3. Para qué usamos tus datos</h2>
            <ul>
              <li>Procesar tu pedido, confirmar tu pago y asignarte tus boletos.</li>
              <li>Permitirte consultar tus boletos con tu cédula o correo.</li>
              <li>Contactarte por correo, llamada o WhatsApp sobre tu compra o, si resultas ganador, para entregarte el premio.</li>
              <li>Realizar y transparentar los sorteos.</li>
              <li>Atender tus consultas y reclamos.</li>
              <li>Cumplir obligaciones legales, contables y las que nos pidan las autoridades.</li>
              <li>Medir qué publicidad funciona y mostrarte anuncios más relevantes, solo si aceptas las cookies.</li>
            </ul>
          </section>

          <section>
            <h2>4. Por qué podemos usar tus datos</h2>
            <p>
              Los usamos porque son necesarios para realizar tu compra, porque la ley nos obliga en ciertos casos y,
              para la medición de publicidad, porque tú nos das tu consentimiento al aceptar las cookies. Puedes
              retirar ese consentimiento cuando quieras.
            </p>
          </section>

          <section>
            <h2>5. Con quién compartimos tus datos</h2>
            <p>No vendemos tus datos. Solo los compartimos con:</p>
            <ul>
              <li><strong>PayPhone</strong>, para cobrar los pagos con tarjeta.</li>
              <li>
                <strong>Meta (Facebook e Instagram)</strong>, únicamente si aceptas las cookies. Le informamos de tu
                navegación y de tus compras (por ejemplo, el valor y la cantidad de boletos), sin enviar tu nombre,
                cédula, correo ni teléfono. Meta puede tratar esa información según sus propias políticas.
              </li>
              <li>Proveedores de tecnología y alojamiento que hacen posible que el sitio funcione.</li>
              <li>Autoridades, cuando la ley lo exija.</li>
            </ul>
          </section>

          <section>
            <h2>6. Ganadores</h2>
            <p>
              Para dar transparencia a los sorteos, en la sección de Resultados y en la transmisión en vivo se muestra
              el nombre de las personas ganadoras. Si resultas ganador, nos pondremos en contacto contigo para
              coordinar la entrega del premio.
            </p>
          </section>

          <section>
            <h2>7. Cookies y píxel de Meta</h2>
            <p>
              Al entrar al sitio te mostramos un aviso para que elijas si aceptas o rechazas las cookies. Si las
              aceptas, usamos el píxel de Meta para saber cuántas personas visitan los sorteos, llegan al pago o
              completan una compra, y así medir nuestra publicidad. Si las rechazas, no se activa y puedes usar el sitio
              con normalidad.
            </p>
            <p>
              Para cambiar tu decisión, borra los datos de este sitio en la configuración de tu navegador y el aviso
              volverá a aparecer.
            </p>
          </section>

          <section>
            <h2>8. Solo para mayores de edad</h2>
            <p>
              Este sitio es solo para personas mayores de 18 años. No recopilamos de forma intencional datos de menores
              de edad. Si descubrimos que lo hicimos, los eliminaremos.
            </p>
          </section>

          <section>
            <h2>9. Cuánto tiempo guardamos tus datos</h2>
            <p>
              Los guardamos durante el tiempo necesario para cumplir las finalidades anteriores, atender posibles
              reclamos y cumplir los plazos que exigen las leyes contables y de sorteos. Después los eliminamos o los
              dejamos de forma que no te identifiquen.
            </p>
          </section>

          <section>
            <h2>10. Cómo protegemos tus datos</h2>
            <p>
              Usamos una conexión cifrada y limitamos el acceso a tus datos al personal autorizado. Aun así, ninguna
              transmisión por internet es completamente segura, por lo que no podemos garantizar una protección
              absoluta.
            </p>
          </section>

          <section>
            <h2>11. Tus derechos</h2>
            <p>
              Conforme a la Ley Orgánica de Protección de Datos Personales de Ecuador, puedes pedirnos en cualquier
              momento:
            </p>
            <ul>
              <li>Acceder a los datos que tenemos sobre ti.</li>
              <li>Rectificar o actualizar los datos incorrectos.</li>
              <li>Eliminar tus datos, cuando no tengamos obligación legal de conservarlos.</li>
              <li>Oponerte al uso de tus datos o pedir que lo suspendamos.</li>
              <li>Recibir tus datos en un formato que puedas usar en otro lugar.</li>
              <li>Retirar tu consentimiento.</li>
            </ul>
            <p>
              Para ejercer estos derechos, escríbenos a <a href={`mailto:${correo}`}>{correo}</a> indicando tu nombre y
              tu número de documento. Si consideras que no atendimos tu solicitud como correspondía, puedes acudir a la
              autoridad de protección de datos personales de Ecuador.
            </p>
          </section>

          <section>
            <h2>12. Cambios en esta política</h2>
            <p>
              Podemos actualizar esta política cuando sea necesario. Siempre mostraremos aquí la fecha de la última
              actualización. Si tienes dudas, visita nuestro <Link to="/ayuda">Centro de ayuda</Link>.
            </p>
          </section>
        </article>
      </div>

      <Footer />
    </div>
  );
}
