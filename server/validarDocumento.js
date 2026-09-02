function validarCedulaEcuador(cedula) {
  if (!/^\d{10}$/.test(cedula)) return false;
  const digitos = cedula.split("").map(Number);
  const provincia = parseInt(cedula.substring(0, 2), 10);
  if (provincia < 1 || provincia > 24) return false;
  if (digitos[2] > 5) return false;

  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let suma = 0;
  for (let i = 0; i < 9; i++) {
    let valor = digitos[i] * coeficientes[i];
    if (valor > 9) valor -= 9;
    suma += valor;
  }
  const decenaSuperior = Math.ceil(suma / 10) * 10;
  let verificador = decenaSuperior - suma;
  if (verificador === 10) verificador = 0;
  return verificador === digitos[9];
}

function validarRucPrivado(digitos) {
  const coeficientes = [4, 3, 2, 7, 6, 5, 4, 3, 2];
  let suma = 0;
  for (let i = 0; i < 9; i++) suma += digitos[i] * coeficientes[i];
  const residuo = suma % 11;
  const verificador = residuo === 0 ? 0 : 11 - residuo;
  return verificador === digitos[9];
}

function validarRucPublico(digitos) {
  const coeficientes = [3, 2, 7, 6, 5, 4, 3, 2];
  let suma = 0;
  for (let i = 0; i < 8; i++) suma += digitos[i] * coeficientes[i];
  const residuo = suma % 11;
  const verificador = residuo === 0 ? 0 : 11 - residuo;
  return verificador === digitos[8];
}

function validarRucEcuador(ruc) {
  if (!/^\d{13}$/.test(ruc)) return false;
  const digitos = ruc.split("").map(Number);
  const provincia = parseInt(ruc.substring(0, 2), 10);
  if (provincia < 1 || provincia > 24) return false;

  const tercerDigito = digitos[2];
  const establecimiento = ruc.substring(10);

  if (tercerDigito <= 5) {
    return validarCedulaEcuador(ruc.substring(0, 10)) && establecimiento !== "000";
  }
  if (tercerDigito === 6) {
    return validarRucPublico(digitos) && ruc.substring(9) !== "0000";
  }
  if (tercerDigito === 9) {
    return validarRucPrivado(digitos) && establecimiento !== "000";
  }
  return false;
}

function validarPasaporte(pasaporte) {
  return /^[A-Za-z0-9]{5,15}$/.test(pasaporte.trim());
}

export function validarDocumento(tipo, numero) {
  const valor = (numero || "").trim();
  if (!valor) return { valido: false, mensaje: "Número de documento requerido" };

  if (tipo === "cedula") {
    return validarCedulaEcuador(valor)
      ? { valido: true }
      : { valido: false, mensaje: "Cédula ecuatoriana inválida" };
  }
  if (tipo === "ruc") {
    return validarRucEcuador(valor)
      ? { valido: true }
      : { valido: false, mensaje: "RUC inválido" };
  }
  if (tipo === "pasaporte") {
    return validarPasaporte(valor)
      ? { valido: true }
      : { valido: false, mensaje: "Pasaporte inválido (solo letras y números, 5 a 15 caracteres)" };
  }
  return { valido: false, mensaje: "Tipo de documento no reconocido" };
}
