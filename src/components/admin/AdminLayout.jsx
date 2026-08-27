import AdminSidebar from "./AdminSidebar.jsx";
import AdminHeader from "./AdminHeader.jsx";
import styles from "./AdminLayout.module.css";

export default function AdminLayout({ title, subtitle, children }) {
  return (
    <div className={styles.adminPage}>
      <AdminSidebar />
      <div className={styles.mainContent}>
        <AdminHeader title={title} subtitle={subtitle} />
        <main className={styles.contentWrap}>
          {children}
        </main>
      </div>
    </div>
  );
}
