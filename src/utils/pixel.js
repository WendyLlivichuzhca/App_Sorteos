// Píxel de Meta (Facebook / Instagram). Solo se carga si el visitante aceptó las cookies
// y nunca en el panel de administración ni en localhost, para no ensuciar las métricas.
// No se envían datos personales (cédula, correo, teléfono, nombre): solo valor y cantidades.
export const PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID || "1814187299903267";

const CLAVE_CONSENTIMIENTO = "cookies_consent";
const CLAVE_DEBUG = "pixel_debug";

let cargado = false;
let ultimaRuta = null;

const leer = (clave) => {
  try {
    return localStorage.getItem(clave);
  } catch {
    return null;
  }
};

const escribir = (clave, valor) => {
  try {
    localStorage.setItem(clave, valor);
  } catch {
    // sin almacenamiento: el aviso volverá a aparecer, no pasa nada
  }
};

// "log" imprime los eventos en consola sin enviarlos a Meta (para probar en desarrollo).
const modoLog = () => leer(CLAVE_DEBUG) === "log";

const esEntornoLocal = () => ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname);

export const getConsentimiento = () => leer(CLAVE_CONSENTIMIENTO); // "aceptado" | "rechazado" | null

export const guardarConsentimiento = (valor) => escribir(CLAVE_CONSENTIMIENTO, valor);

export function cargarPixel() {
  if (cargado || typeof window === "undefined") return;
  if (getConsentimiento() !== "aceptado") return;
  if (esEntornoLocal() && !modoLog()) return;
  cargado = true;

  if (modoLog()) return;

  // Fragmento oficial de Meta
  /* eslint-disable */
  !(function (f, b, e, v, n, t, s) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = !0;
    n.version = "2.0";
    n.queue = [];
    t = b.createElement(e);
    t.async = !0;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
  /* eslint-enable */
  window.fbq("init", PIXEL_ID);
}

export function pixelTrack(evento, datos = {}, opciones = {}) {
  if (!cargado) return;
  if (modoLog()) {
    console.info("[pixel]", evento, datos, opciones);
    return;
  }
  if (typeof window.fbq !== "function") return;
  window.fbq("track", evento, datos, opciones);
}

export function pixelPageView(ruta) {
  if (!cargado || ruta === ultimaRuta) return;
  ultimaRuta = ruta;
  pixelTrack("PageView");
}

// Evita contar dos veces el mismo evento (por ejemplo, si el cliente recarga la página de confirmación).
export function pixelTrackUnaVez(clave, evento, datos, opciones) {
  const marca = `pixel_${clave}`;
  if (leer(marca)) return;
  if (!cargado) return;
  escribir(marca, "1");
  pixelTrack(evento, datos, opciones);
}

cargarPixel();
