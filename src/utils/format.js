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

export const generarNumeroBoleto = () =>
  String(Math.floor(10000 + Math.random() * 90000));

export const generarNumeroCompra = () =>
  `TCK-${Date.now().toString().slice(-8)}`;
