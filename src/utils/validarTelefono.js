export function limpiarTelefono(texto, pais = "Ecuador") {
  const soloDigitos = texto.replace(/\D/g, "");
  return pais === "Ecuador" ? soloDigitos.slice(0, 10) : soloDigitos.slice(0, 15);
}

export function validarTelefono(texto, pais = "Ecuador") {
  const valor = (texto || "").trim();
  if (!valor) return { valido: false, mensaje: "Ingresa tu número de teléfono" };

  if (pais === "Ecuador") {
    if (/^09\d{8}$/.test(valor)) return { valido: true };
    if (/^0[2-7]\d{7}$/.test(valor)) return { valido: true };
    return { valido: false, mensaje: "Teléfono inválido (celular: 10 dígitos empezando en 09, o fijo: 9 dígitos)" };
  }

  if (/^\d{6,15}$/.test(valor)) return { valido: true };
  return { valido: false, mensaje: "Ingresa un número de teléfono válido (solo números, sin espacios ni símbolos)" };
}
