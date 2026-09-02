const PATRON_NOMBRE = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]+$/;

export function validarNombre(texto) {
  const valor = (texto || "").trim();
  return valor.length >= 2 && PATRON_NOMBRE.test(valor);
}
