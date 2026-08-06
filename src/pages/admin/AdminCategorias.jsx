import { useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout.jsx";
import Icon from "../../icons/Icon.jsx";
import { categorias as initialCategorias } from "../../data/sorteos.js";
import styles from "./AdminSorteos.module.css";

export default function AdminCategorias() {
  const [cats, setCats] = useState(initialCategorias);
  const [newLabel, setNewLabel] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editLabel, setEditLabel] = useState("");

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newLabel.trim()) return;
    const newCat = {
      id: newLabel.toLowerCase().replace(/\s+/g, "-"),
      label: newLabel,
      icon: "dots",
    };
    setCats([...cats, newCat]);
    setNewLabel("");
  };

  const handleStartEdit = (c) => {
    setEditingId(c.id);
    setEditLabel(c.label);
  };

  const handleSaveEdit = (id) => {
    setCats(cats.map((c) => (c.id === id ? { ...c, label: editLabel } : c)));
    setEditingId(null);
  };

  const handleDelete = (id) => {
    if (window.confirm("¿Seguro que deseas eliminar esta categoría?")) {
      setCats(cats.filter((c) => c.id !== id));
    }
  };

  return (
    <AdminLayout title="Gestión de Categorías">
      <div className={styles.topRow}>
        <div>
          <h2>Categorías de Sorteos</h2>
          <p>Crea, edita y elimina categorías (Carros, Ropa, Tecnología, Casas, Motos)</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "24px" }}>
        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID Identificador</th>
                <th>Nombre Categoría</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cats.map((c) => (
                <tr key={c.id}>
                  <td><code>{c.id}</code></td>
                  <td>
                    {editingId === c.id ? (
                      <input
                        type="text"
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        style={{ padding: "6px 10px", borderRadius: "6px", border: "1.5px solid #6d3cf5" }}
                      />
                    ) : (
                      <strong>{c.label}</strong>
                    )}
                  </td>
                  <td>
                    <div className={styles.actionsCell}>
                      {editingId === c.id ? (
                        <button type="button" className={styles.iconBtn} onClick={() => handleSaveEdit(c.id)}>
                          💾 Guardar
                        </button>
                      ) : (
                        <button type="button" className={styles.iconBtn} onClick={() => handleStartEdit(c)}>
                          ✏️ Editar
                        </button>
                      )}
                      <button type="button" className={styles.iconBtn} onClick={() => handleDelete(c.id)}>
                        🗑️ Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.tableCard} style={{ padding: "20px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: "800" }}>Crear Nueva Categoría</h3>
          <form onSubmit={handleAdd} style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <input
              type="text"
              placeholder="Nombre (Ej: Casas, Viajes)"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              style={{ padding: "10px", borderRadius: "8px", border: "1.5px solid #ecebf3" }}
            />
            <button type="submit" className={styles.createBtn} style={{ justifyContent: "center" }}>
              + Crear Categoría
            </button>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
