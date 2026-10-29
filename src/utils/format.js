export const formatMoney = (value) =>
  `$${Number(value).toFixed(2).replace(".", ",")}`;

export const formatDate = (isoOrDate) => {
  const d = new Date(isoOrDate);
  const dia = String(d.getDate()).padStart(2, "0");
  const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const mes = meses[d.getMonth()];
  const anio = d.getFullYear();
  let horas = d.getHours();
  const minutos = String(d.getMinutes()).padStart(2, "0");
  const ampm = horas >= 12 ? "PM" : "AM";
  horas = horas % 12 || 12;
  return `${dia} ${mes} ${anio} - ${horas}:${minutos} ${ampm}`;
};

const DIAS_SEMANA = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MESES_LARGO = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

// Los sorteos por fecha guardan el cierre como 'YYYY-MM-DDTHH:mm' en hora de Ecuador (UTC-5).
// Se lee a mano para que el resultado no dependa de la zona horaria del navegador.
export const momentoCierre = (fechaCierre) => {
  if (!fechaCierre) return null;
  const ms = Date.parse(`${fechaCierre}:00-05:00`);
  return Number.isNaN(ms) ? null : ms;
};

// '2026-11-27' -> 'viernes 27 de noviembre'
export const formatFechaLarga = (fecha) => {
  const [anio, mes, dia] = String(fecha || "").slice(0, 10).split("-").map(Number);
  if (!anio || !mes || !dia) return "";
  const d = new Date(anio, mes - 1, dia);
  return `${DIAS_SEMANA[d.getDay()]} ${dia} de ${MESES_LARGO[mes - 1]}`;
};

// '2026-11-26T23:59' -> 'jueves 26 de noviembre, 23:59'
export const formatCierre = (fechaCierre) => {
  if (!fechaCierre) return "";
  const hora = String(fechaCierre).slice(11, 16);
  return `${formatFechaLarga(fechaCierre)}${hora ? `, ${hora}` : ""}`;
};

export const generarNumeroBoleto = () =>
  String(Math.floor(10000 + Math.random() * 90000));

export const generarNumeroCompra = () =>
  `TCK-${Date.now().toString().slice(-8)}`;
