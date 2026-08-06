import { useState, useEffect } from "react";
import AdminLayout from "../../components/admin/AdminLayout.jsx";
import Icon from "../../icons/Icon.jsx";
import { getSorteos, createSorteo, updateSorteo, deleteSorteo } from "../../services/api.js";
import { formatMoney } from "../../utils/format.js";
import styles from "./AdminSorteos.module.css";

export default function AdminSorteos() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    nombre: "",
    categoria: "autos",
    precio: 2.0,
    total: 1000,
    estado: "activo",
    fechaSorteo: "2026-08-30",
    galeria: [],
  });

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({ nombre: "", categoria: "autos", precio: 2.0, total: 1000, estado: "activo", fechaSorteo: "2026-08-30", galeria: [] });
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      nombre: item.nombre,
      categoria: item.categoria,
      precio: item.precio,
      total: item.total,
      estado: item.estado,
      fechaSorteo: item.fechaSorteo || "2026-08-30",
      galeria: item.galeria || [],
    });
    setShowModal(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (editingItem) {
      setList((prev) =>
        prev.map((s) => (s.id === editingItem.id ? { ...s, ...formData } : s))
      );
    } else {
      const newItem = {
        id: `sorteo-${Date.now()}`,
        ...formData,
        vendidos: 0,
        disponibles: formData.total,
        rating: 5,
        reviews: 0,
        paquetes: [],
      };
      setList((prev) => [newItem, ...prev]);
    }
    setShowModal(false);
  };

  const handleDelete = (id) => {
    if (window.confirm("¿Seguro que deseas eliminar este sorteo?")) {
      setList((prev) => prev.filter((s) => s.id !== id));
    }
  };

  return (
    <AdminLayout title="Gestión de Sorteos">
      <div className={styles.topRow}>
        <div>
          <h2>Todos los Sorteos</h2>
          <p>Crea, edita, activa o finaliza tus sorteos</p>
        </div>
        <button type="button" className={styles.createBtn} onClick={handleOpenCreate}>
          <Icon name="plus" size={18} /> Crear Nuevo Sorteo
        </button>
      </div>

      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nombre del Sorteo</th>
              <th>Categoría</th>
              <th>Precio / Boleto</th>
              <th>Progreso Venta</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {list.map((s) => (
              <tr key={s.id}>
                <td>
                  <strong className={styles.nameText}>{s.nombre}</strong>
                </td>
                <td><span className={styles.categoryBadge}>{s.categoria}</span></td>
                <td><strong>{formatMoney(s.precio)}</strong></td>
                <td>
                  <div className={styles.progressCell}>
                    <span>{s.vendidos} / {s.total}</span>
                    <div className={styles.miniTrack}>
                      <div
                        className={styles.miniFill}
                        style={{ width: `${Math.round((s.vendidos / (s.total || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`${styles.statusPill} ${styles[s.estado]}`}>
                    {s.estado.toUpperCase()}
                  </span>
                </td>
                <td>
                  <div className={styles.actionsCell}>
                    <button type="button" className={styles.iconBtn} onClick={() => handleOpenEdit(s)} title="Editar">
                      ✏️
                    </button>
                    <button type="button" className={styles.iconBtn} onClick={() => handleDelete(s.id)} title="Eliminar">
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Crear / Editar */}
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>{editingItem ? "Editar Sorteo" : "Crear Nuevo Sorteo"}</h3>
              <button type="button" className={styles.closeBtn} onClick={() => setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleSave} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Nombre del Premio / Sorteo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Chevrolet Camaro SS"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Categoría</label>
                  <select
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                  >
                    <option value="autos">Autos</option>
                    <option value="motos">Motos</option>
                    <option value="tecnologia">Tecnología</option>
                    <option value="ropa">Ropa</option>
                    <option value="hogar">Hogar</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Precio por boleto ($)</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={formData.precio}
                    onChange={(e) => setFormData({ ...formData, precio: parseFloat(e.target.value) })}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Galería de Fotos del Sorteo (Subir varias imágenes)</label>
                <div style={{ background: "#f8f7fc", padding: "16px", borderRadius: "12px", border: "1.5px dashed #6d3cf5" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "12px" }}>
                    {formData.galeria.map((imgSrc, idx) => (
                      <div key={idx} style={{ position: "relative" }}>
                        <img
                          src={imgSrc}
                          alt={`Foto ${idx + 1}`}
                          style={{ width: "70px", height: "70px", borderRadius: "8px", objectFit: "cover", border: "1px solid #ecebf3" }}
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, galeria: formData.galeria.filter((_, i) => i !== idx) })}
                          style={{ position: "absolute", top: "-6px", right: "-6px", background: "#ef4444", color: "#fff", border: "none", borderRadius: "50%", width: "20px", height: "20px", fontSize: "11px", cursor: "pointer" }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    {formData.galeria.length === 0 && (
                      <span style={{ fontSize: "12px", color: "#9795a8" }}>No has añadido fotos aún.</span>
                    )}
                  </div>

                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                      const files = Array.from(e.target.files);
                      files.forEach((file) => {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setFormData((prev) => ({
                            ...prev,
                            galeria: [...prev.galeria, reader.result],
                          }));
                        };
                        reader.readAsDataURL(file);
                      });
                    }}
                    style={{ fontSize: "13px" }}
                  />
                  <span style={{ display: "block", fontSize: "11px", color: "#6b6880", marginTop: "6px" }}>
                    Puedes seleccionar <strong>múltiples fotos a la vez</strong> desde tu computadora (Vista frontal, lateral, interior, etc.).
                  </span>
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Fecha Programada del Sorteo</label>
                  <input
                    type="date"
                    required
                    value={formData.fechaSorteo}
                    onChange={(e) => setFormData({ ...formData, fechaSorteo: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>URL de Imagen Directa (Opcional)</label>
                  <input
                    type="text"
                    placeholder="https://ejemplo.com/imagen.png"
                    value={formData.imagenUrl}
                    onChange={(e) => setFormData({ ...formData, imagenUrl: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Total de boletos</label>
                  <input
                    type="number"
                    required
                    value={formData.total}
                    onChange={(e) => setFormData({ ...formData, total: parseInt(e.target.value, 10) })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Estado</label>
                  <select
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                  >
                    <option value="activo">🟢 Activo</option>
                    <option value="proximamente">🟡 Próximamente</option>
                    <option value="agotado">⚫ Agotado</option>
                    <option value="finalizado">🔴 Finalizado</option>
                  </select>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className={styles.saveBtn}>
                  Guardar Sorteo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
