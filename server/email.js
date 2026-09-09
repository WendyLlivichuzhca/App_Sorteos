import nodemailer from 'nodemailer';

let transporter;
let avisoFaltaConfig = false;

// Si el .env no tiene las variables SMTP configuradas, el envio se salta en
// silencio (con un aviso una sola vez en los logs) en vez de tumbar la compra.
function getTransporter() {
  if (transporter) return transporter;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    if (!avisoFaltaConfig) {
      console.warn('[email] SMTP no configurado (faltan SMTP_HOST/SMTP_USER/SMTP_PASS en .env) — no se enviaran correos de numeros comprados.');
      avisoFaltaConfig = true;
    }
    return null;
  }
  const port = parseInt(SMTP_PORT || '465', 10);
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transporter;
}

export async function enviarCorreoNumerosComprados({ correo, nombre, sorteoNombre, codigo, numeros, totalPagado }) {
  const t = getTransporter();
  if (!t || !correo) return;

  const nombreEmpresa = process.env.SMTP_FROM_NAME || 'Sorteos en Línea';
  const listaNumeros = numeros.map((n) => `#${n}`).join(', ');

  try {
    await t.sendMail({
      from: `"${nombreEmpresa}" <${process.env.SMTP_USER}>`,
      to: correo,
      subject: `Tus números para "${sorteoNombre}" — Pedido ${codigo}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
          <h2 style="color:#146B45;">¡Gracias por tu compra, ${nombre}!</h2>
          <p>Tu pago fue confirmado. Estos son tus números para el sorteo <strong>${sorteoNombre}</strong>:</p>
          <p style="font-size: 18px; font-weight: bold; background:#f0fdf4; padding: 12px 16px; border-radius: 8px; color:#146B45;">
            ${listaNumeros}
          </p>
          <p>Código de pedido: <strong>${codigo}</strong></p>
          <p>Total pagado: <strong>$${totalPagado}</strong></p>
          <p style="color:#666; font-size: 13px;">Guarda este correo, lo vas a necesitar para verificar tu participación.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error('[email] Error enviando correo de números comprados:', err.message);
  }
}
