import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout.jsx";
import Icon from "../../icons/Icon.jsx";
import PremioImage from "../../components/PremioImage.jsx";
import { getSorteos, createSorteo, updateSorteo, deleteSorteo, getCategorias } from "../../services/api.js";
import { formatMoney } from "../../utils/format.js";
import styles from "./AdminSorteos.module.css";

export default function AdminSorteos() {
  const [list, setList] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    categoria: "",
    precio: 2.0,
    total: 1000,
    estado: "activo",
    galeria: [],
    imagenUrl: "",
    incluyeTexto: "",
  });

  const cargarSorteos = () => {
    setLoading(true);
    getSorteos()
      .then((data) => setList(data))
      .catch((err) => console.error("Error cargando sorteos:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    cargarSorteos();
    getCategorias()
      .then(setCategorias)
      .catch((err) => console.error("Error cargando categorías:", err));
  }, []);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({ nombre: "", categoria: categorias[0]?.slug || "", precio: 2.0, total: 1000, estado: "activo", galeria: [], imagenUrl: "", incluyeTexto: "" });
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    // Si la categoría guardada del sorteo ya no existe (por ejemplo, se borró esa
    // categoría después), el <select> solo puede mostrar las que sí existen — así que
    // se usa la primera disponible como valor real, para que lo que se ve en pantalla
    // sea lo mismo que se va a guardar.
    const categoriaValida = categorias.some((c) => c.slug === item.categoria)
      ? item.categoria
      : (categorias[0]?.slug || item.categoria);
    setFormData({
      nombre: item.nombre,
      categoria: categoriaValida,
      precio: item.precio,
      total: item.total,
      estado: item.estado,
      galeria: item.galeria || [],
      imagenUrl: "",
      incluyeTexto: (item.incluye || []).join("\n"),
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (guardando) return;
    setGuardando(true);
    try {
      const galeria = formData.imagenUrl
        ? [...formData.galeria, formData.imagenUrl]
        : formData.galeria;
      const incluye = formData.incluyeTexto
        .split("\n")
        .map((linea) => linea.trim())
        .filter(Boolean);
      const { incluyeTexto, ...resto } = formData;
      const payload = { ...resto, galeria, incluye };

      if (editingItem) {
        await updateSorteo(editingItem.id, payload);
      } else {
        await createSorteo(payload);
      }
      setShowModal(false);
      cargarSorteos();
    } catch (err) {
      alert(err.message || "No se pudo guardar el sorteo");
    } finally {
      setGuardando(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este sorteo?")) return;
    try {
      await deleteSorteo(id);
      cargarSorteos();
    } catch (err) {
      alert(err.message || "No se pudo eliminar el sorteo");
    }
  };

  const kpis = [
    { label: "Total Sorteos", value: list.length, subtitle: "Sorteos creados", icon: "ticket", color: "purple" },
    { label: "Activos", value: list.filter((s) => s.estado === "activo").length, subtitle: "En progreso", icon: "chart", color: "green" },
    { label: "Finalizados", value: list.filter((s) => s.estado === "finalizado").length, subtitle: "Completados", icon: "award", color: "blue" },
    { label: "Participaciones", value: list.reduce((acc, s) => acc + (s.vendidos || 0), 0), subtitle: "Total registradas", icon: "users", color: "orange" },
  ];

  const listaFiltrada = filtroEstado === "todos" ? list : list.filter((s) => s.estado === filtroEstado);

  return (
    <AdminLayout title="Gestión de Sorteos" subtitle="Administra y controla todos los sorteos de la plataforma">
      <div className={styles.topRow}>
        <div />
        <button type="button" className={styles.createBtn} onClick={handleOpenCreate}>
          <Icon name="plus" size={18} /> Crear Nuevo Sorteo
        </button>
      </div>

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

      <div className={styles.tableCard}>
        <div className={styles.tableCardHeader}>
          <div>
            <h3>Todos los Sorteos</h3>
            <p>Crea, edita, activa o finaliza tus sorteos</p>
          </div>
          <select
            className={styles.filterSelect}
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
          >
            <option value="todos">Todos los estados</option>
            <option value="activo">Activo</option>
            <option value="proximamente">Próximamente</option>
            <option value="agotado">Agotado</option>
            <option value="finalizado">Finalizado</option>
          </select>
        </div>
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
            {loading && (
              <tr><td colSpan={6}>Cargando sorteos...</td></tr>
            )}
            {!loading && listaFiltrada.length === 0 && (
              <tr><td colSpan={6}>No hay sorteos que coincidan con este filtro.</td></tr>
            )}
            {listaFiltrada.map((s) => (
              <tr key={s.id}>
                <td>
                  <div className={styles.nameCell}>
                    <PremioImage categoria={s.categoria} src={s.galeria?.[0]} className={styles.thumb} iconSize={18} />
                    <strong className={styles.nameText}>{s.nombre}</strong>
                  </div>
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
                    <Link to={`/admin/sorteos/${s.id}/lugares`} className={styles.iconBtn} title="Premio Mayor y Lugares" style={{ textDecoration: "none" }}>
                      🏆
                    </Link>
                    <Link to={`/admin/sorteos/${s.id}/premiados`} className={styles.iconBtn} title="Números Premiados" style={{ textDecoration: "none" }}>
                      🎁
                    </Link>
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

              <div className={styles.formGroup}>
                <label>Incluye además (opcional)</label>
                <textarea
                  rows="3"
                  placeholder={"Un extra por línea, ej:\nIncluye 1 año de seguro pagado\nIncluye matrícula y placas"}
                  value={formData.incluyeTexto}
                  onChange={(e) => setFormData({ ...formData, incluyeTexto: e.target.value })}
                />
                <span style={{ display: "block", fontSize: "11px", color: "#7E897F", marginTop: "6px" }}>
                  Si lo dejas vacío, esta sección no aparece en la página del sorteo.
                </span>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Categoría</label>
                  <select
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                  >
                    {categorias.map((c) => (
                      <option key={c.id} value={c.slug}>{c.nombre}</option>
                    ))}
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
                <div style={{ background: "#101512", padding: "16px", borderRadius: "12px", border: "1.5px dashed #1F8A5A" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "12px" }}>
                    {formData.galeria.map((imgSrc, idx) => (
                      <div key={idx} style={{ position: "relative" }}>
                        <img
                          src={imgSrc}
                          alt={`Foto ${idx + 1}`}
                          style={{ width: "70px", height: "70px", borderRadius: "8px", objectFit: "cover", border: "1px solid #26332C" }}
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
                      <span style={{ fontSize: "12px", color: "#7E897F" }}>No has añadido fotos aún.</span>
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
                  <span style={{ display: "block", fontSize: "11px", color: "#A9B3AD", marginTop: "6px" }}>
                    Puedes seleccionar <strong>múltiples fotos a la vez</strong> desde tu computadora (Vista frontal, lateral, interior, etc.).
                  </span>
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>URL de Imagen Directa (Opcional)</label>
                  <input
                    type="text"
                    placeholder="https://ejemplo.com/imagen.png"
                    value={formData.imagenUrl}
                    onChange={(e) => setFormData({ ...formData, imagenUrl: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Total de boletos</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="100000"
                    value={formData.total}
                    onChange={(e) => setFormData({ ...formData, total: parseInt(e.target.value, 10) })}
                  />
                </div>
              </div>

              <div className={styles.formRow}>
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
                <button type="submit" className={styles.saveBtn} disabled={guardando}>
                  {guardando ? "Guardando..." : "Guardar Sorteo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
