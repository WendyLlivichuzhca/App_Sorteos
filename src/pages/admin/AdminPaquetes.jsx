import { useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout.jsx";
import styles from "./AdminSorteos.module.css";

const initialPaquetes = [
  { id: "p1", nombre: "Paquete Básico", boletos: 1, descuento: 0, regla: "Sin descuento" },
  { id: "p2", nombre: "Paquete Popular", boletos: 5, descuento: 10, regla: "Ahorro 10%" },
  { id: "p3", nombre: "Paquete VIP", boletos: 10, descuento: 20, regla: "Ahorro 20%" },
  { id: "p4", nombre: "Paquete Premium", boletos: 20, descuento: 30, regla: "Ahorro 30%" },
  { id: "p5", nombre: "Cantidad Personalizada", boletos: "Variable", descuento: "Dinámico", regla: "Ahorro automático" },
];

export default function AdminPaquetes() {
  const [list, setList] = useState(initialPaquetes);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ nombre: "", boletos: 1, descuento: 0 });

  const handleCreate = (e) => {
    e.preventDefault();
    if (!formData.nombre) return;
    const newP = {
      id: `p-${Date.now()}`,
      nombre: formData.nombre,
      boletos: formData.boletos,
      descuento: formData.descuento,
      regla: `Ahorro ${formData.descuento}%`,
    };
    setList([...list, newP]);
    setShowModal(false);
    setFormData({ nombre: "", boletos: 1, descuento: 0 });
  };

  const handleDelete = (id) => {
    setList(list.filter((p) => p.id !== id));
  };

  return (
    <AdminLayout title="Gestión de Paquetes">
      <div className={styles.topRow}>
        <div>
          <h2>Paquetes y Descuentos de Boletos</h2>
          <p>Configura precio, cantidad de boletos y porcentaje de descuento</p>
        </div>
        <button type="button" className={styles.createBtn} onClick={() => setShowModal(true)}>
          📦 Crear Nuevo Paquete
        </button>
      </div>

      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nombre Paquete</th>
              <th>Boletos Incluidos</th>
              <th>Descuento (%)</th>
              <th>Regla de Ahorro</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id}>
                <td><strong>{p.nombre}</strong></td>
                <td>{p.boletos} {typeof p.boletos === "number" ? (p.boletos === 1 ? "Boleto" : "Boletos") : ""}</td>
                <td><span className={styles.categoryBadge}>{p.descuento === 0 ? "0%" : `${p.descuento}% OFF`}</span></td>
                <td>{p.regla}</td>
                <td>
                  <button type="button" className={styles.iconBtn} onClick={() => handleDelete(p.id)}>
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
              <h3>Crear Nuevo Paquete</h3>
              <button type="button" className={styles.closeBtn} onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreate} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Nombre del Paquete</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Paquete Platino"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Cantidad de Boletos</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.boletos}
                    onChange={(e) => setFormData({ ...formData, boletos: parseInt(e.target.value, 10) })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Descuento (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="90"
                    value={formData.descuento}
                    onChange={(e) => setFormData({ ...formData, descuento: parseInt(e.target.value, 10) })}
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className={styles.saveBtn}>Guardar Paquete</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
