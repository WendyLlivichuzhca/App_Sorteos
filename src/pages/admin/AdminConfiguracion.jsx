import { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout.jsx";
import { getConfiguracion, updateConfiguracion } from "../../services/api.js";
import { resizeImageToDataUrl } from "../../utils/imageResize.js";
import styles from "./AdminSorteos.module.css";

const metodosPagoNombres = [
  { key: "transferencia", name: "Transferencia bancaria o depósito" },
  { key: "payphone", name: "Tarjeta de crédito o débito (Visa, Mastercard, Diners, Discover)" },
  { key: "qr", name: "Pago con código QR (JEP Fácil)" },
];

export default function AdminConfiguracion() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [config, setConfig] = useState({
    nombreEmpresa: "",
    whatsapp: "",
    correo: "",
    facebook: "",
    instagram: "",
    tiktok: "",
    colorTema: "#1F8A5A",
    politicas: "",
    faqTexto: "",
    instruccionesPago: "",
    qrPago: "",
    logoUrl: "",
  });
  const [metodos, setMetodos] = useState({});
  const [cuentasBancarias, setCuentasBancarias] = useState([]);
  const [qrPagos, setQrPagos] = useState([]);

  useEffect(() => {
    getConfiguracion()
      .then((data) => {
        setConfig({
          nombreEmpresa: data.nombre_empresa,
          whatsapp: data.whatsapp,
          correo: data.correo,
          facebook: data.facebook,
          instagram: data.instagram,
          tiktok: data.tiktok,
          colorTema: data.color_tema,
          politicas: data.politicas || "",
          faqTexto: data.faq_texto || "",
          instruccionesPago: data.instrucciones_pago || "",
          qrPago: data.qr_pago || "",
          logoUrl: data.logo_url || "",
        });
        setMetodos(data.metodosPago || {});
        setCuentasBancarias(data.cuentasBancarias || []);
        setQrPagos(data.qrPagos || []);
      })
      .catch((err) => console.error("Error cargando configuración:", err))
      .finally(() => setLoading(false));
  }, []);

  const toggleMetodo = (key) => {
    setMetodos({ ...metodos, [key]: !metodos[key] });
  };

  const agregarCuenta = () => {
    setCuentasBancarias((prev) => [
      ...prev,
      { banco: "", tipoCuenta: "", numeroCuenta: "", titular: "", cedulaTitular: "" },
    ]);
  };

  const actualizarCuenta = (idx, campo, valor) => {
    setCuentasBancarias((prev) => prev.map((c, i) => (i === idx ? { ...c, [campo]: valor } : c)));
  };

  const quitarCuenta = (idx) => {
    setCuentasBancarias((prev) => prev.filter((_, i) => i !== idx));
  };

  const agregarQr = () => {
    setQrPagos((prev) => [...prev, { etiqueta: "", imagen: "" }]);
  };

  const actualizarQrEtiqueta = (idx, valor) => {
    setQrPagos((prev) => prev.map((q, i) => (i === idx ? { ...q, etiqueta: valor } : q)));
  };

  const actualizarQrImagen = async (idx, file) => {
    if (!file) return;
    try {
      const dataUrl = await resizeImageToDataUrl(file, 500);
      setQrPagos((prev) => prev.map((q, i) => (i === idx ? { ...q, imagen: dataUrl } : q)));
    } catch (err) {
      alert(err.message || "No se pudo procesar la imagen");
    }
  };

  const quitarQr = (idx) => {
    setQrPagos((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateConfiguracion({ ...config, metodosPago: metodos, cuentasBancarias, qrPagos });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert(err.message || "No se pudo guardar la configuración");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Configuración General" subtitle="Configura métodos de pago, redes sociales, datos de la empresa y políticas">
        <p>Cargando configuración...</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Configuración General" subtitle="Configura métodos de pago, redes sociales, datos de la empresa y políticas">
      {saved && (
        <div style={{ background: "#10301F", color: "#4ADE80", padding: "12px 18px", borderRadius: "10px", fontWeight: "700", marginBottom: "20px" }}>
          ✅ Cambios guardados con éxito en la plataforma.
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        {/* Formulario Datos Empresa & Redes */}
        <div className={styles.tableCard} style={{ padding: "24px" }}>
          <h3 style={{ fontSize: "13.5px", fontWeight: "800", marginBottom: "16px" }}>Empresa & Redes Sociales</h3>
          <form onSubmit={handleSave} className={styles.form} style={{ padding: 0 }}>
            <div className={styles.formGroup}>
              <label>Logo de la Empresa</label>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                {config.logoUrl && (
                  <>
                    <img
                      src={config.logoUrl}
                      alt="Logo"
                      style={{ width: "56px", height: "56px", objectFit: "contain", border: "1.5px solid #26332C", borderRadius: "10px", background: "#fff" }}
                    />
                    <button
                      type="button"
                      className={styles.iconBtn}
                      onClick={() => setConfig({ ...config, logoUrl: "" })}
                    >
                      🗑️ Quitar logo
                    </button>
                  </>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  try {
                    const dataUrl = await resizeImageToDataUrl(file, 320);
                    setConfig((prev) => ({ ...prev, logoUrl: dataUrl }));
                  } catch (err) {
                    alert(err.message || "No se pudo procesar la imagen");
                  }
                }}
                style={{ fontSize: "13px" }}
              />
              <span style={{ fontSize: "11.5px", color: "#7E897F" }}>
                Reemplaza el ícono que aparece junto al nombre de la empresa en todo el sitio. Si no subes uno, se usa el ícono por defecto.
              </span>
            </div>

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

            <button type="submit" className={styles.createBtn} style={{ marginTop: "10px", width: "100%", justifyContent: "center" }} disabled={saving}>
              {saving ? "Guardando..." : "Guardar Cambios"}
            </button>
          </form>
        </div>

        {/* Métodos de Pago & Políticas */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Métodos de Pago Activos */}
          <div className={styles.tableCard} style={{ padding: "24px" }}>
            <h3 style={{ fontSize: "13.5px", fontWeight: "800", marginBottom: "14px" }}>Métodos de Pago Aceptados</h3>
            <p style={{ fontSize: "13px", color: "#A9B3AD", marginBottom: "16px" }}>Activa o desactiva las pasarelas visibles para el cliente</p>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {metodosPagoNombres.map((m) => (
                <label key={m.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#101512", padding: "12px 16px", borderRadius: "10px", cursor: "pointer" }}>
                  <span style={{ fontSize: "13.5px", fontWeight: "600", color: "#F2F5F3" }}>{m.name}</span>
                  <input
                    type="checkbox"
                    checked={Boolean(metodos[m.key])}
                    onChange={() => toggleMetodo(m.key)}
                    style={{ width: "18px", height: "18px", accentColor: "#1F8A5A" }}
                  />
                </label>
              ))}
            </div>

            <div className={styles.formGroup} style={{ marginTop: "16px" }}>
              <label>Cuentas Bancarias para Transferencias</label>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {cuentasBancarias.map((c, idx) => (
                  <div key={idx} style={{ background: "#101512", border: "1.5px dashed #26332C", borderRadius: "10px", padding: "12px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "8px" }}>
                      <input
                        type="text"
                        placeholder="Banco o cooperativa (ej: JEP, Pichincha)"
                        value={c.banco}
                        onChange={(e) => actualizarCuenta(idx, "banco", e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Tipo de cuenta (Ahorros, Corriente...)"
                        value={c.tipoCuenta}
                        onChange={(e) => actualizarCuenta(idx, "tipoCuenta", e.target.value)}
                      />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "8px" }}>
                      <input
                        type="text"
                        placeholder="Número de cuenta"
                        value={c.numeroCuenta}
                        onChange={(e) => actualizarCuenta(idx, "numeroCuenta", e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Nombre del titular"
                        value={c.titular}
                        onChange={(e) => actualizarCuenta(idx, "titular", e.target.value)}
                      />
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input
                        type="text"
                        placeholder="Cédula/RUC del titular"
                        value={c.cedulaTitular}
                        onChange={(e) => actualizarCuenta(idx, "cedulaTitular", e.target.value)}
                        style={{ flex: 1 }}
                      />
                      <button type="button" className={styles.iconBtn} onClick={() => quitarCuenta(idx)} title="Quitar cuenta">
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className={styles.iconBtn}
                onClick={agregarCuenta}
                style={{ marginTop: "10px", width: "100%" }}
              >
                + Agregar cuenta bancaria
              </button>
              <span style={{ fontSize: "11.5px", color: "#7E897F", display: "block", marginTop: "8px" }}>
                Cada cuenta se muestra como una tarjeta separada al cliente cuando elige pagar por transferencia. Puedes agregar varias.
              </span>
            </div>

            <div className={styles.formGroup} style={{ marginTop: "16px" }}>
              <label>Notas adicionales de pago (opcional)</label>
              <textarea
                rows="3"
                placeholder="Cualquier instrucción extra, ej: horario de atención, o a quién contactar por WhatsApp si tiene dudas."
                value={config.instruccionesPago}
                onChange={(e) => setConfig({ ...config, instruccionesPago: e.target.value })}
                style={{ padding: "10px", borderRadius: "10px", border: "1.5px solid #26332C", background: "#101512", color: "#E4E8E5", fontSize: "13px", outline: "none" }}
              />
              <span style={{ fontSize: "11.5px", color: "#7E897F" }}>
                Si solo tienes texto libre y no quieres usar el formato de tarjetas de arriba, puedes escribir todo aquí en su lugar.
              </span>
            </div>

            <div className={styles.formGroup} style={{ marginTop: "16px" }}>
              <label>Códigos QR de Pago (JEP Fácil u otros)</label>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {qrPagos.map((q, idx) => (
                  <div key={idx} style={{ background: "#101512", border: "1.5px dashed #26332C", borderRadius: "10px", padding: "12px", display: "flex", gap: "12px", alignItems: "flex-start" }}>
                    {q.imagen && (
                      <img
                        src={q.imagen}
                        alt={q.etiqueta || "QR de pago"}
                        style={{ width: "70px", height: "70px", objectFit: "contain", border: "1.5px solid #26332C", borderRadius: "8px", background: "#fff", flexShrink: 0 }}
                      />
                    )}
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                      <input
                        type="text"
                        placeholder="Nombre del QR (ej: JEP Fácil, Banco Pichincha)"
                        value={q.etiqueta}
                        onChange={(e) => actualizarQrEtiqueta(idx, e.target.value)}
                      />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => actualizarQrImagen(idx, e.target.files[0])}
                        style={{ fontSize: "12.5px" }}
                      />
                    </div>
                    <button type="button" className={styles.iconBtn} onClick={() => quitarQr(idx)} title="Quitar QR">
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className={styles.iconBtn}
                onClick={agregarQr}
                style={{ marginTop: "10px", width: "100%" }}
              >
                + Agregar código QR
              </button>
              <span style={{ fontSize: "11.5px", color: "#7E897F", display: "block", marginTop: "8px" }}>
                Cada QR se muestra como una tarjeta separada al cliente cuando elige pagar con QR. Puedes agregar varios.
              </span>
            </div>
          </div>

          {/* Políticas & Términos */}
          <div className={styles.tableCard} style={{ padding: "24px" }}>
            <h3 style={{ fontSize: "13.5px", fontWeight: "800", marginBottom: "14px" }}>Políticas y Preguntas Frecuentes</h3>

            <div className={styles.formGroup} style={{ marginBottom: "14px" }}>
              <label>Políticas de Privacidad y Sorteos</label>
              <textarea
                rows="3"
                value={config.politicas}
                onChange={(e) => setConfig({ ...config, politicas: e.target.value })}
                style={{ padding: "10px", borderRadius: "10px", border: "1.5px solid #26332C", background: "#101512", color: "#E4E8E5", fontSize: "13px", outline: "none" }}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Preguntas Frecuentes (Texto Ayuda)</label>
              <textarea
                rows="3"
                value={config.faqTexto}
                onChange={(e) => setConfig({ ...config, faqTexto: e.target.value })}
                style={{ padding: "10px", borderRadius: "10px", border: "1.5px solid #26332C", background: "#101512", color: "#E4E8E5", fontSize: "13px", outline: "none" }}
              />
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
