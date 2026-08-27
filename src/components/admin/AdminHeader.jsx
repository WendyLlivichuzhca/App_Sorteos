import { useNavigate } from "react-router-dom";
import Icon from "../../icons/Icon.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import styles from "./AdminHeader.module.css";

export default function AdminHeader({ title, subtitle }) {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/admin/login", { replace: true });
  };

  const inicial = admin?.usuario?.[0]?.toUpperCase() || "A";

  return (
    <header className={styles.header}>
      <div>
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>

      <div className={styles.right}>
        <div className={styles.search}>
          <Icon name="search" size={16} className={styles.searchIcon} />
          <input type="text" placeholder="Buscar en admin..." />
        </div>

        <div className={styles.userProfile}>
          <div className={styles.avatar}>{inicial}</div>
          <div className={styles.userInfo}>
            <strong>{admin?.usuario || "Administrador"}</strong>
            <span>Super Administrador</span>
          </div>
        </div>

        <button type="button" onClick={handleLogout} title="Cerrar sesión" style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", padding: "8px" }}>
          <Icon name="logOut" size={18} />
        </button>
      </div>
    </header>
  );
}
