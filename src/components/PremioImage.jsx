import { useState, useEffect } from "react";
import Icon from "../icons/Icon.jsx";
import styles from "./PremioImage.module.css";

const iconByCategoria = {
  autos: "car",
  motos: "bike",
  tecnologia: "phone",
  ropa: "shirt",
  hogar: "home",
  mas: "dots",
};

const gradientByCategoria = {
  autos: "linear-gradient(135deg, #1A4A2E, #1F8A5A)",
  motos: "linear-gradient(135deg, #3d1740, #e63950)",
  tecnologia: "linear-gradient(135deg, #101a3d, #2f6df5)",
  ropa: "linear-gradient(135deg, #1f3d2e, #22a35a)",
  hogar: "linear-gradient(135deg, #3d2a10, #e08a1f)",
  mas: "linear-gradient(135deg, #4A3A1A, #C9A961)",
};

export default function PremioImage({ categoria, src, images, className = "", iconSize = 46 }) {
  const gallery = images && images.length > 0 ? images : src ? [src] : [];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [gallery.length, gallery[0]]);

  useEffect(() => {
    if (gallery.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % gallery.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [gallery.length]);

  const current = gallery[index];

  if (current) {
    return (
      <div className={`${styles.wrap} ${className}`} style={{ background: "#0B0F0D" }}>
        <img key={`fg-${current}`} src={current} alt="Premio" className={styles.fgImg} />
        {gallery.length > 1 && (
          <div className={styles.dots}>
            {gallery.map((_, i) => (
              <span key={i} className={`${styles.dot} ${i === index ? styles.dotActive : ""}`} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`${styles.wrap} ${className}`}
      style={{ background: gradientByCategoria[categoria] || gradientByCategoria.mas }}
    >
      <Icon name={iconByCategoria[categoria] || "dots"} size={iconSize} strokeWidth={1.3} className={styles.icon} />
    </div>
  );
}
