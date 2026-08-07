// Tramos de descuento por defecto, usados solo si la BD no tiene ninguno configurado todavía.
export const TRAMOS_DEFAULT = [
  { cantidad_minima: 20, porcentaje: 30 },
  { cantidad_minima: 10, porcentaje: 20 },
  { cantidad_minima: 5, porcentaje: 10 },
];

export function calcularDescuento(cantidad, tramos = TRAMOS_DEFAULT) {
  const ordenados = [...tramos].sort((a, b) => b.cantidad_minima - a.cantidad_minima);
  const match = ordenados.find((t) => cantidad >= t.cantidad_minima);
  return match ? match.porcentaje : 0;
}

export function calcularTotal(precioUnitario, cantidad, tramos = TRAMOS_DEFAULT) {
  const base = precioUnitario * cantidad;
  const descuento = calcularDescuento(cantidad, tramos);
  const total = descuento > 0 ? base * (1 - descuento / 100) : base;
  return Math.round(total * 100) / 100;
}
