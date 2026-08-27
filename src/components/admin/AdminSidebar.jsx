import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { getConfiguracion } from "../../services/api.js";
import Icon from "../../icons/Icon.jsx";
import styles from "./AdminSidebar.module.css";

const menuGroups = [
  {
    title: "PRINCIPAL",
    items: [
      { path: "/admin", label: "Dashboard", icon: "home" },
    ],
  },
  {
    title: "GESTIÓN DE SORTEOS",
    items: [
      { path: "/admin/sorteos", label: "Sorteos", icon: "ticket" },
      { path: "/admin/categorias", label: "Categorías", icon: "dots" },
      { path: "/admin/paquetes", label: "Descuentos", icon: "box" },
      { path: "/admin/boletos", label: "Boletos", icon: "ticket" },
    ],
  },
  {
    title: "VENTAS Y CLIENTES",
    items: [
      { path: "/admin/compras", label: "Compras y Pagos", icon: "card" },
      { path: "/admin/clientes", label: "Clientes", icon: "users" },
      { path: "/admin/ganadores", label: "Ganadores", icon: "award" },
    ],
  },
  {
    title: "SISTEMA Y REPORTES",
    items: [
      { path: "/admin/reportes", label: "Reportes", icon: "chart" },
      { path: "/admin/configuracion", label: "Configuración", icon: "settings" },
      { path: "/admin/administradores", label: "Mi Cuenta", icon: "shield" },
    ],
  },
];

export default function AdminSidebar() {
  const location = useLocation();
  const [nombreEmpresa, setNombreEmpresa] = useState("El Trébol de Gaya");

  useEffect(() => {
    getConfiguracion()
      .then((config) => setNombreEmpresa(config.nombre_empresa || "El Trébol de Gaya"))
      .catch((err) => console.error("Error cargando configuración:", err));
  }, []);

  return (
    <aside className={styles.sidebar}>
      {/* Logo Header */}
      <div className={styles.brand}>
        <div className={styles.logoBadge}>
          <img src="/logo-icon.svg" alt="" className={styles.logoImg} />
        </div>
        <div className={styles.logoInfo}>
          <span className={styles.brandTitle}>{nombreEmpresa}</span>
          <span className={styles.adminBadge}>PANEL ADMIN</span>
        </div>
      </div>

      {/* Menu Navigation */}
      <nav className={styles.menu}>
        {menuGroups.map((group) => (
          <div key={group.title} className={styles.group}>
            <span className={styles.groupTitle}>{group.title}</span>
            <div className={styles.groupItems}>
              {group.items.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`${styles.item} ${isActive ? styles.itemActive : ""}`}
                  >
                    <span className={styles.itemIcon}>
                      <Icon name={item.icon} size={18} strokeWidth={1.8} />
                    </span>
                    <span className={styles.itemLabel}>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer: ayuda + link al sitio público */}
      <div className={styles.footer}>
        <div className={styles.helpCard}>
          <span className={styles.helpText}>¿Necesitas ayuda?</span>
          <Link to="/" className={styles.publicLink} target="_blank">
            Visita el sitio del cliente <Icon name="externalLink" size={16} />
          </Link>
        </div>
      </div>
    </aside>
  );
}
