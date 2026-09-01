import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { updateAccount } from "../../services/api.js";
import styles from "./AdminSorteos.module.css";

export default function AdminUsuarios() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(admin?.usuario || "");
  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNueva, setPasswordNueva] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (passwordNueva !== confirmarPassword) {
      setError("La nueva contraseña y su confirmación no coinciden");
      return;
    }
    if (passwordNueva.length < 6) {
      setError("La nueva contraseña debe tener al menos 6 caracteres");
      return;
    }

    setGuardando(true);
    try {
      await updateAccount({ usuario, passwordActual, passwordNueva });
      alert("Cuenta actualizada. Vuelve a iniciar sesión con tus nuevas credenciales.");
      logout();
      navigate("/admin/login", { replace: true });
    } catch (err) {
      setError(err.message || "No se pudo actualizar la cuenta");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <AdminLayout title="Mi Cuenta" subtitle="Este sistema usa un único administrador. Cambia tu usuario o contraseña aquí.">
      <div className={styles.tableCard} style={{ padding: "20px", maxWidth: "440px" }}>
        <h3 style={{ fontSize: "13.5px", fontWeight: "800", color: "#F2F5F3", marginBottom: "14px" }}>Editar Credenciales</h3>
        <form onSubmit={handleSubmit} className={styles.form} style={{ padding: 0 }}>
          <div className={styles.formGroup}>
            <label>Nombre de Usuario</label>
            <input
              type="text"
              required
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Contraseña Actual</label>
            <input
              type="password"
              required
              value={passwordActual}
              onChange={(e) => setPasswordActual(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Nueva Contraseña</label>
            <input
              type="password"
              required
              value={passwordNueva}
              onChange={(e) => setPasswordNueva(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Confirmar Nueva Contraseña</label>
            <input
              type="password"
              required
              value={confirmarPassword}
              onChange={(e) => setConfirmarPassword(e.target.value)}
            />
          </div>

          {error && <div style={{ color: "#ef4444", fontSize: "13px" }}>⚠️ {error}</div>}

          <button type="submit" className={styles.createBtn} style={{ justifyContent: "center", marginTop: "8px" }} disabled={guardando}>
            {guardando ? "Guardando..." : "Actualizar Cuenta"}
          </button>
        </form>
      </div>
    </AdminLayout>
  );
}
