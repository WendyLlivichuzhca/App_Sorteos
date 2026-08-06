// Replica los tramos de descuento por volumen que se muestran en el frontend (Paquetes.jsx)
export function calcularDescuento(cantidad) {
  if (cantidad >= 20) return 30;
  if (cantidad >= 10) return 20;
  if (cantidad >= 5) return 10;
  return 0;
}

export function calcularTotal(precioUnitario, cantidad) {
  const base = precioUnitario * cantidad;
  const descuento = calcularDescuento(cantidad);
  const total = descuento > 0 ? base * (1 - descuento / 100) : base;
  return Math.round(total * 100) / 100;
}
