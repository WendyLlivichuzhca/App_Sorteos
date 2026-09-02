const PATRON_NOMBRE = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]+$/;

export function limpiarNombre(texto) {
  return texto.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]/g, "").replace(/\s{2,}/g, " ").replace(/^\s+/, "");
}

export function validarNombre(texto) {
  const valor = (texto || "").trim();
  return valor.length >= 2 && PATRON_NOMBRE.test(valor);
}
