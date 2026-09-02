const DOMINIOS_DESECHABLES = new Set([
  "mailinator.com",
  "guerrillamail.com",
  "guerrillamail.net",
  "guerrillamail.org",
  "guerrillamail.biz",
  "guerrillamail.de",
  "guerrillamailblock.com",
  "sharklasers.com",
  "grr.la",
  "pokemail.net",
  "spam4.me",
  "10minutemail.com",
  "10minutemail.net",
  "20minutemail.com",
  "temp-mail.org",
  "temp-mail.io",
  "tempmail.com",
  "tempmail.net",
  "throwawaymail.com",
  "mailnesia.com",
  "mailcatch.com",
  "mintemail.com",
  "dispostable.com",
  "fakeinbox.com",
  "fakemailgenerator.com",
  "getnada.com",
  "mohmal.com",
  "trashmail.com",
  "trashmail.net",
  "trash-mail.com",
  "yopmail.com",
  "yopmail.net",
  "yopmail.fr",
  "spambog.com",
  "maildrop.cc",
  "tempinbox.com",
  "emailondeck.com",
  "mytemp.email",
  "discard.email",
  "discardmail.com",
  "mailmetrash.com",
  "mailnull.com",
  "harakirimail.com",
  "inboxkitten.com",
  "mail-temporaire.fr",
  "correotemporal.org",
  "correotemporal.com",
]);

export function esCorreoDesechable(correo) {
  const dominio = (correo || "").trim().split("@")[1]?.toLowerCase();
  return Boolean(dominio && DOMINIOS_DESECHABLES.has(dominio));
}

export function validarCorreo(correo) {
  const valor = (correo || "").trim();
  if (!/^\S+@\S+\.\S+$/.test(valor)) return { valido: false, mensaje: "Ingresa un correo válido" };
  if (esCorreoDesechable(valor)) return { valido: false, mensaje: "No se aceptan correos temporales, usa uno real" };
  return { valido: true };
}
