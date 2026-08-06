import { useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout.jsx";
import styles from "./AdminSorteos.module.css";
import { ganadores as initialGanadores } from "../../data/sorteos.js";

export default function AdminGanadores() {
  const [list, setList] = useState(initialGanadores);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    sorteo: "iPhone 15 Pro Max",
    categoria: "tecnologia",
    ganador: "",
    ciudad: "Quito, Ecuador",
    boleto: "#",
  });

  const handleCreate = (e) => {
    e.preventDefault();
    if (!form.ganador || !form.boleto) return;
    const newG = {
      id: `g-${Date.now()}`,
      ...form,
      fecha: "Hoy",
      premioEntregado: true,
    };
    setList([newG, ...list]);
    setShowModal(false);
  };

  return (
    <AdminLayout title="Gestión de Ganadores">
      <div className={styles.topRow}>
        <div>
          <h2>Publicación y Registro de Ganadores</h2>
          <p>Registra el número de boleto ganador y publica los premios entregados</p>
        </div>
        <button type="button" className={styles.createBtn} onClick={() => setShowModal(true)}>
          🏆 Registrar Nuevo Ganador
        </button>
      </div>

      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Sorteo</th>
              <th>Ganador</th>
              <th>Ciudad</th>
              <th>Boleto Ganador</th>
              <th>Fecha Sorteo</th>
              <th>Premio Entregado</th>
            </tr>
          </thead>
          <tbody>
            {list.map((g) => (
              <tr key={g.id}>
                <td><strong>{g.sorteo}</strong></td>
                <td>{g.ganador}</td>
                <td>{g.ciudad}</td>
                <td><span className={styles.categoryBadge}>{g.boleto}</span></td>
                <td>{g.fecha}</td>
                <td><span className={`${styles.statusPill} ${styles.activo}`}>VERIFICADO</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Registrar Boleto Ganador</h3>
              <button type="button" className={styles.closeBtn} onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreate} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Nombre del Sorteo</label>
                <input
                  type="text"
                  required
                  value={form.sorteo}
                  onChange={(e) => setForm({ ...form, sorteo: e.target.value })}
                />
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Nombre del Ganador</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Pedro Ramírez"
                    value={form.ganador}
                    onChange={(e) => setForm({ ...form, ganador: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Número de Boleto Ganador</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: #0421"
                    value={form.boleto}
                    onChange={(e) => setForm({ ...form, boleto: e.target.value })}
                  />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className={styles.saveBtn}>Publicar Ganador</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
