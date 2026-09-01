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

export default function PremioImage({ categoria, src, className = "", iconSize = 46 }) {
  if (src) {
    return (
      <div className={`${styles.wrap} ${className}`} style={{ background: "#17152b" }}>
        <img src={src} alt="Premio" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
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
