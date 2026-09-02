export function limpiarTelefono(texto) {
  return texto.replace(/\D/g, "").slice(0, 10);
}

export function validarTelefono(texto) {
  const valor = (texto || "").trim();
  if (!valor) return { valido: false, mensaje: "Ingresa tu número de teléfono" };
  if (/^09\d{8}$/.test(valor)) return { valido: true };
  if (/^0[2-7]\d{7}$/.test(valor)) return { valido: true };
  return { valido: false, mensaje: "Teléfono inválido (celular: 10 dígitos empezando en 09, o fijo: 9 dígitos)" };
}
