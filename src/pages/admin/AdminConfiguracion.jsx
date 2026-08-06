import { useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout.jsx";
import styles from "./AdminSorteos.module.css";

export default function AdminConfiguracion() {
  const [saved, setSaved] = useState(false);
  const [config, setConfig] = useState({
    nombreEmpresa: "SORTEOS EN LÍNEA",
    whatsapp: "+593 99 999 9999",
    correo: "soporte@sorteosenlinea.com",
    facebook: "https://facebook.com/sorteosenlinea",
    instagram: "https://instagram.com/sorteosenlinea",
    tiktok: "https://tiktok.com/@sorteosenlinea",
    colorTema: "#6d3cf5",
    politicas: "Todos los sorteos son supervisados y auditados. Los boletos son únicos y no reembolsables una vez realizado el sorteo.",
    faqTexto: "¿Cómo sé si gané? Te contactaremos por teléfono y WhatsApp oficial inmediatamente después del sorteo.",
  });

  const [metodos, setMetodos] = useState({
    tarjeta: true,
    payphone: true,
    deuna: true,
    transferencia: true,
    paypal: true,
  });

  const toggleMetodo = (key) => {
    setMetodos({ ...metodos, [key]: !metodos[key] });
  };

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <AdminLayout title="Configuración General">
      <div className={styles.topRow}>
        <div>
          <h2>Ajustes Globales de la Plataforma</h2>
          <p>Configura métodos de pago, redes sociales, datos de la empresa, colores y políticas</p>
        </div>
      </div>

      {saved && (
        <div style={{ background: "#dcf5e3", color: "#16a34a", padding: "12px 18px", borderRadius: "10px", fontWeight: "700", marginBottom: "20px" }}>
          ✅ Cambios guardados con éxito en la plataforma.
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        {/* Formulario Datos Empresa & Redes */}
        <div className={styles.tableCard} style={{ padding: "24px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: "800", marginBottom: "16px" }}>Empresa & Redes Sociales</h3>
          <form onSubmit={handleSave} className={styles.form} style={{ padding: 0 }}>
            <div className={styles.formGroup}>
              <label>Nombre Comercial de la Empresa</label>
              <input
                type="text"
                value={config.nombreEmpresa}
                onChange={(e) => setConfig({ ...config, nombreEmpresa: e.target.value })}
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>WhatsApp Soporte</label>
                <input
                  type="text"
                  value={config.whatsapp}
                  onChange={(e) => setConfig({ ...config, whatsapp: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Correo Electrónico</label>
                <input
                  type="email"
                  value={config.correo}
                  onChange={(e) => setConfig({ ...config, correo: e.target.value })}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Color Principal del Tema</label>
              <input
                type="color"
                value={config.colorTema}
                onChange={(e) => setConfig({ ...config, colorTema: e.target.value })}
                style={{ height: "42px", padding: "4px", cursor: "pointer" }}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Instagram</label>
              <input
                type="text"
                value={config.instagram}
                onChange={(e) => setConfig({ ...config, instagram: e.target.value })}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Facebook</label>
              <input
                type="text"
                value={config.facebook}
                onChange={(e) => setConfig({ ...config, facebook: e.target.value })}
              />
            </div>

            <div className={styles.formGroup}>
              <label>TikTok</label>
              <input
                type="text"
                value={config.tiktok}
                onChange={(e) => setConfig({ ...config, tiktok: e.target.value })}
              />
            </div>

            <button type="submit" className={styles.createBtn} style={{ marginTop: "10px", width: "100%", justifyContent: "center" }}>
              Guardar Cambios
            </button>
          </form>
        </div>

        {/* Métodos de Pago & Políticas */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Métodos de Pago Activos */}
          <div className={styles.tableCard} style={{ padding: "24px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "800", marginBottom: "14px" }}>Métodos de Pago Aceptados</h3>
            <p style={{ fontSize: "13px", color: "#6b6880", marginBottom: "16px" }}>Activa o desactiva las pasarelas visibles para el cliente</p>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {[
                { key: "tarjeta", name: "Tarjeta de crédito / débito (Visa, MC)" },
                { key: "payphone", name: "PayPhone (Código QR)" },
                { key: "deuna", name: "DeUna! (Pago móvil)" },
                { key: "transferencia", name: "Transferencia bancaria" },
                { key: "paypal", name: "PayPal" },
              ].map((m) => (
                <label key={m.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f8f7fc", padding: "12px 16px", borderRadius: "10px", cursor: "pointer" }}>
                  <span style={{ fontSize: "13.5px", fontWeight: "600", color: "#17152b" }}>{m.name}</span>
                  <input
                    type="checkbox"
                    checked={metodos[m.key]}
                    onChange={() => toggleMetodo(m.key)}
                    style={{ width: "18px", height: "18px", accentColor: "#6d3cf5" }}
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Políticas & Términos */}
          <div className={styles.tableCard} style={{ padding: "24px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "800", marginBottom: "14px" }}>Políticas y Preguntas Frecuentes</h3>
            
            <div className={styles.formGroup} style={{ marginBottom: "14px" }}>
              <label>Políticas de Privacidad y Sorteos</label>
              <textarea
                rows="3"
                value={config.politicas}
                onChange={(e) => setConfig({ ...config, politicas: e.target.value })}
                style={{ padding: "10px", borderRadius: "10px", border: "1.5px solid #ecebf3", fontSize: "13px", outline: "none" }}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Preguntas Frecuentes (Texto Ayuda)</label>
              <textarea
                rows="3"
                value={config.faqTexto}
                onChange={(e) => setConfig({ ...config, faqTexto: e.target.value })}
                style={{ padding: "10px", borderRadius: "10px", border: "1.5px solid #ecebf3", fontSize: "13px", outline: "none" }}
              />
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
