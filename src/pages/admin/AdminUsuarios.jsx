import { useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout.jsx";
import styles from "./AdminSorteos.module.css";

const initialAdmins = [
  { id: "u1", nombre: "Admin Principal", usuario: "admin.master", rol: "Superadministrador", estado: "activo" },
  { id: "u2", nombre: "Soporte Ventas", usuario: "soporte.ventas", rol: "Editor de Sorteos", estado: "activo" },
];

export default function AdminUsuarios() {
  const [list, setList] = useState(initialAdmins);
  const [showModal, setShowModal] = useState(false);
  const [nombre, setNombre] = useState("");
  const [usuario, setUsuario] = useState("");

  const handleCreate = (e) => {
    e.preventDefault();
    if (!nombre.trim() || !usuario.trim()) return;
    const newAdmin = {
      id: `u-${Date.now()}`,
      nombre,
      usuario,
      rol: "Editor de Sorteos",
      estado: "activo",
    };
    setList([...list, newAdmin]);
    setShowModal(false);
    setNombre("");
    setUsuario("");
  };

  const handleDelete = (id) => {
    if (list.length <= 1) {
      alert("Debe quedar al menos un administrador principal.");
      return;
    }
    setList(list.filter((u) => u.id !== id));
  };

  return (
    <AdminLayout title="Gestión de Administradores">
      <div className={styles.topRow}>
        <div>
          <h2>Usuarios Administradores</h2>
          <p>Crea y gestiona permisos de los administradores con acceso al panel</p>
        </div>
        <button type="button" className={styles.createBtn} onClick={() => setShowModal(true)}>
          👤 Nuevo Administrador
        </button>
      </div>

      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nombre Completo</th>
              <th>Usuario / Login</th>
              <th>Rol / Permisos</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {list.map((u) => (
              <tr key={u.id}>
                <td><strong>{u.nombre}</strong></td>
                <td><code>{u.usuario}</code></td>
                <td><span className={styles.categoryBadge}>{u.rol}</span></td>
                <td><span className={`${styles.statusPill} ${styles.activo}`}>ACTIVO</span></td>
                <td>
                  <button type="button" className={styles.iconBtn} onClick={() => handleDelete(u.id)}>
                    🗑️ Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Crear Administrador</h3>
              <button type="button" className={styles.closeBtn} onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreate} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Nombre Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Andrés Morales"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Nombre de Usuario (Login)</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: andres.admin"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                />
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className={styles.saveBtn}>Crear Usuario</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
