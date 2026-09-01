// Cambia el icono de la pestaña del navegador. Si no hay logo propio subido,
// no toca nada y se queda con el que ya viene fijo en index.html.
export function setFavicon(url) {
  if (!url) return;
  let link = document.querySelector('link[rel="icon"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.href = url;
}
