import Icon from "../../icons/Icon.jsx";
import styles from "./AdminHeader.module.css";

export default function AdminHeader({ title }) {
  return (
    <header className={styles.header}>
      <h1 className={styles.title}>{title}</h1>

      <div className={styles.right}>
        <div className={styles.search}>
          <Icon name="search" size={16} className={styles.searchIcon} />
          <input type="text" placeholder="Buscar en admin..." />
        </div>

        <div className={styles.userProfile}>
          <div className={styles.avatar}>A</div>
          <div className={styles.userInfo}>
            <strong>Admin Principal</strong>
            <span>Super Administrador</span>
          </div>
        </div>
      </div>
    </header>
  );
}
