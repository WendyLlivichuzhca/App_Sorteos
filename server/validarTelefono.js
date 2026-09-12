import { isValidPhoneNumber } from "libphonenumber-js";

export function validarTelefono(texto) {
  const valor = (texto || "").trim();
  if (!valor) return { valido: false, mensaje: "Ingresa tu número de teléfono" };
  if (isValidPhoneNumber(valor)) return { valido: true };
  return { valido: false, mensaje: "Ingresa un número de teléfono válido" };
}
