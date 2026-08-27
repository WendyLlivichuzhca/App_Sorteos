import { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout.jsx";
import Icon from "../../icons/Icon.jsx";
import { getCategorias, createCategoria, updateCategoria, deleteCategoria, getSorteos } from "../../services/api.js";
import styles from "./AdminSorteos.module.css";

export default function AdminCategorias() {
  const [cats, setCats] = useState([]);
  const [sorteos, setSorteos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newLabel, setNewLabel] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editLabel, setEditLabel] = useState("");

  const cargarCategorias = () => {
    setLoading(true);
    getCategorias()
      .then(setCats)
      .catch((err) => console.error("Error cargando categorías:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    cargarCategorias();
    getSorteos()
      .then(setSorteos)
      .catch((err) => console.error("Error cargando sorteos:", err));
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newLabel.trim()) return;
    try {
      const slug = newLabel.trim().toLowerCase().replace(/\s+/g, "-");
      await createCategoria({ nombre: newLabel.trim(), slug, icono: "dots" });
      setNewLabel("");
      cargarCategorias();
    } catch (err) {
      alert(err.message || "No se pudo crear la categoría");
    }
  };

  const handleStartEdit = (c) => {
    setEditingId(c.id);
    setEditLabel(c.nombre);
  };

  const handleSaveEdit = async (c) => {
    try {
      await updateCategoria(c.id, { nombre: editLabel, slug: c.slug, icono: c.icono });
      setEditingId(null);
      cargarCategorias();
    } catch (err) {
      alert(err.message || "No se pudo guardar la categoría");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta categoría?")) return;
    try {
      await deleteCategoria(id);
      cargarCategorias();
    } catch (err) {
      alert(err.message || "No se pudo eliminar la categoría");
    }
  };

  const conteoPorCategoria = cats.map((c) => ({
    ...c,
    total: sorteos.filter((s) => s.categoria === c.slug).length,
  }));
  const masUsada = conteoPorCategoria.reduce((max, c) => (c.total > (max?.total || 0) ? c : max), null);
  const sinUso = conteoPorCategoria.filter((c) => c.total === 0).length;

  const kpis = [
    { label: "Total Categorías", value: cats.length, subtitle: "Categorías creadas", icon: "dots", color: "purple" },
    { label: "Sorteos Creados", value: sorteos.length, subtitle: "En todas las categorías", icon: "ticket", color: "green" },
    { label: "Más Usada", value: masUsada ? masUsada.nombre : "—", subtitle: masUsada ? `${masUsada.total} sorteos` : "Todavía ninguna", icon: "award", color: "blue" },
    { label: "Sin Sorteos", value: sinUso, subtitle: "Categorías sin usar", icon: "box", color: "orange" },
  ];

  return (
    <AdminLayout title="Gestión de Categorías" subtitle="Crea, edita y elimina categorías (Carros, Ropa, Tecnología, Casas, Motos)">
      <div className={styles.kpiGrid}>
        {kpis.map((k) => (
          <div key={k.label} className={styles.kpiCard}>
            <div className={`${styles.kpiIconWrap} ${styles[k.color]}`}>
              <Icon name={k.icon} size={19} />
            </div>
            <div>
              <span className={styles.kpiLabel}>{k.label}</span>
              <strong className={styles.kpiValue}>{k.value}</strong>
              <span className={styles.kpiSubtitle}>{k.subtitle}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "24px" }}>
        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Slug</th>
                <th>Nombre Categoría</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={3}>Cargando...</td></tr>}
              {!loading && cats.length === 0 && <tr><td colSpan={3}>No hay categorías todavía.</td></tr>}
              {cats.map((c) => (
                <tr key={c.id}>
                  <td><code>{c.slug}</code></td>
                  <td>
                    {editingId === c.id ? (
                      <input
                        type="text"
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        style={{ padding: "6px 10px", borderRadius: "8px", border: "1.5px solid #6d3cf5", fontSize: "12px" }}
                      />
                    ) : (
                      <strong>{c.nombre}</strong>
                    )}
                  </td>
                  <td>
                    <div className={styles.actionsCell}>
                      {editingId === c.id ? (
                        <button type="button" className={styles.iconBtn} onClick={() => handleSaveEdit(c)} title="Guardar">
                          💾
                        </button>
                      ) : (
                        <button type="button" className={styles.iconBtn} onClick={() => handleStartEdit(c)} title="Editar">
                          ✏️
                        </button>
                      )}
                      <button type="button" className={styles.iconBtn} onClick={() => handleDelete(c.id)} title="Eliminar">
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.tableCard} style={{ padding: "18px" }}>
          <h3 style={{ fontSize: "13.5px", fontWeight: "800", color: "#17152b" }}>Crear Nueva Categoría</h3>
          <form onSubmit={handleAdd} style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <input
              type="text"
              placeholder="Nombre (Ej: Casas, Viajes)"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: "9px", border: "1.5px solid #ecebf3", fontSize: "12px" }}
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
