import { useEffect, useState } from "react";
import AdminSidebar from "./AdminSidebar.jsx";
import AdminHeader from "./AdminHeader.jsx";
import { getConfiguracion } from "../../services/api.js";
import styles from "./AdminLayout.module.css";

export default function AdminLayout({ title, subtitle, children }) {
  const [nombreEmpresa, setNombreEmpresa] = useState("El Trébol de Gaya");

  useEffect(() => {
    getConfiguracion()
      .then((config) => setNombreEmpresa(config.nombre_empresa || "El Trébol de Gaya"))
      .catch((err) => console.error("Error cargando configuración:", err));
  }, []);

  return (
    <div className={styles.adminPage}>
      <AdminSidebar />
      <div className={styles.mainContent}>
        <AdminHeader title={title} subtitle={subtitle} />
        <main className={styles.contentWrap}>
          {children}
        </main>
        <footer className={styles.footer}>
          <span>© {new Date().getFullYear()} {nombreEmpresa}. Todos los derechos reservados.</span>
          <span className={styles.version}>Versión 1.0.0</span>
        </footer>
      </div>
    </div>
  );
}
