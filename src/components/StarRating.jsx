import Icon from "../icons/Icon.jsx";
import styles from "./StarRating.module.css";

export default function StarRating({ rating = 5, reviews }) {
  return (
    <div className={styles.wrap}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Icon
          key={i}
          name="star"
          size={15}
          strokeWidth={1.2}
          className={i < rating ? styles.filled : styles.empty}
        />
      ))}
      {typeof reviews === "number" && <span className={styles.count}>({reviews})</span>}
    </div>
  );
}
