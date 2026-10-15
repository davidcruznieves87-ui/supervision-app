import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import theme from "../styles/theme";

function MainLayout({ children, usuario }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
  const [cerrandoSesion, setCerrandoSesion] = useState(false);

  const rol = (usuario?.rol || "")
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const modulosOrion = [
    { nombre: "📞 Llamadas Técnicas", ruta: "/llamados-tecnicos" },
    { nombre: "📄 Hojas de Servicio", ruta: "/hojas-servicio" },
  ];

  let menu = [];

  if (rol === "superadmin") {
    menu = [
      { nombre: "📊 Dashboard", ruta: "/" },
      { nombre: "📝 Supervisiones", ruta: "/supervisiones" },
      { nombre: "📁 Historial", ruta: "/historial" },
      { nombre: "🔨 Mantenimientos", ruta: "/mantenimiento" },
      { nombre: "📈 Dashboard MTTO", ruta: "/dashboard-mantenimiento" },
      { nombre: "👨‍💼 Administración", ruta: "/admin" },
      { nombre: "📊 Dashboard Ejecutivo", ruta: "/dashboard-ejecutivo" },
      { nombre: "🔍 Comparador JSON", ruta: "/comparador-json" },
      { nombre: "🌐 Conectividad", ruta: "/conectividad" },
      { nombre: "📋 Actividades", ruta: "/actividades" },
      ...modulosOrion,
      { nombre: "💰 Nómina", ruta: "/nomina" },
      { nombre: "📧 Auditoría Correos", ruta: "/auditoria-correos" },
    ];
  } else if (rol === "supervisor") {
    menu = [
      { nombre: "📊 Dashboard", ruta: "/" },
      { nombre: "📝 Supervisiones", ruta: "/supervisiones" },
      { nombre: "📁 Historial", ruta: "/historial" },
      { nombre: "🔄 Rotaciones", ruta: "/historial-rotaciones" },
      { nombre: "👨‍💼 Administración", ruta: "/admin" },
      { nombre: "📈 Mantenimientos Realizados", ruta: "/dashboard-mantenimiento" },
      { nombre: "📊 Dashboard Ejecutivo", ruta: "/dashboard-ejecutivo" },
      { nombre: "🔍 Comparador JSON", ruta: "/comparador-json" },
      { nombre: "🌐 Conectividad", ruta: "/conectividad" },
      { nombre: "📋 Actividades", ruta: "/actividades" },
      ...modulosOrion,
      { nombre: "💰 Nómina", ruta: "/nomina" },
      { nombre: "📧 Auditoría Correos", ruta: "/auditoria-correos" },
    ];
  } else if (rol === "admin") {
    menu = [
      { nombre: "📊 Dashboard", ruta: "/" },
      { nombre: "👨‍💼 Administración", ruta: "/admin" },
      { nombre: "📁 Historial", ruta: "/historial" },
      { nombre: "📈 Dashboard General", ruta: "/dashboard-mantenimiento" },
      { nombre: "📊 Dashboard Ejecutivo", ruta: "/dashboard-ejecutivo" },
      { nombre: "🔍 Comparador JSON", ruta: "/comparador-json" },
      { nombre: "🌐 Conectividad", ruta: "/conectividad" },
      { nombre: "📋 Actividades", ruta: "/actividades" },
      ...modulosOrion,
      { nombre: "📧 Auditoría Correos", ruta: "/auditoria-correos" },
    ];
  } else if (rol === "tecnico") {
    menu = [
      { nombre: "🔨 Mantenimiento", ruta: "/mantenimiento" },
      { nombre: "📈 Dashboard MTTO", ruta: "/dashboard-mantenimiento" },
    ];
  }

  useEffect(() => {
    setMenuMovilAbierto(false);
  }, [location.pathname]);

  const cerrarSesion = async () => {
    if (cerrandoSesion) return;
    setCerrandoSesion(true);
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      setCerrandoSesion(false);
    }
  };

  const nombreUsuario = usuario?.nombre || "Usuario";
  const inicial = nombreUsuario.trim().charAt(0).toUpperCase() || "U";
  const moduloActual = menu.find((item) =>
    item.ruta === "/" ? location.pathname === "/" :
      location.pathname === item.ruta || location.pathname.startsWith(`${item.ruta}/`)
  );

  return (
    <div className="supervision-layout" style={{
      display: "flex", minHeight: "100vh", background: theme.colors.background,
      color: theme.colors.text,
    }}>
      <style>{`
        .supervision-layout { font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
        .supervision-sidebar { width: 258px; height: 100vh; position: sticky; top: 0; display: flex; flex-direction: column; flex-shrink: 0; box-sizing: border-box; z-index: 50; }
        .supervision-nav { display: flex; flex-direction: column; gap: 5px; overflow-y: auto; min-height: 0; padding: 4px 2px 12px; scrollbar-width: thin; scrollbar-color: #475569 transparent; }
        .supervision-nav-link { display: flex; align-items: center; min-height: 42px; box-sizing: border-box; text-decoration: none; transition: background .18s ease, box-shadow .18s ease, transform .18s ease; }
        .supervision-nav-link:hover { background: rgba(148,163,184,.15) !important; transform: translateX(2px); }
        .supervision-nav-link[aria-current="page"]:hover { background: linear-gradient(135deg,#0891B2,#2563EB) !important; }
        .supervision-menu-button { display: none; border: 1px solid #CBD5E1; border-radius: 10px; background: white; color: #0F172A; cursor: pointer; font-size: 21px; width: 42px; height: 42px; }
        .supervision-backdrop { display: none; }
        .supervision-main { flex: 1; min-width: 0; box-sizing: border-box; }
        .supervision-content { min-width: 0; }
        @media (max-width: 900px) {
          .supervision-sidebar { position: fixed; top: 0; bottom: 0; left: 0; transform: translateX(-105%); transition: transform .22s ease; height: 100dvh; }
          .supervision-sidebar.is-open { transform: translateX(0); }
          .supervision-backdrop.is-open { display: block; position: fixed; inset: 0; background: rgba(15,23,42,.6); z-index: 40; }
          .supervision-menu-button { display: inline-flex; align-items: center; justify-content: center; }
          .supervision-main { width: 100%; }
        }
        @media (max-width: 560px) {
          .supervision-topbar { padding: 12px 14px !important; }
          .supervision-content { padding: 12px !important; }
          .supervision-page-title { font-size: 15px !important; }
        }
      `}</style>

      <div
        className={`supervision-backdrop${menuMovilAbierto ? " is-open" : ""}`}
        onClick={() => setMenuMovilAbierto(false)}
        aria-hidden="true"
      />

      <aside
        className={`supervision-sidebar${menuMovilAbierto ? " is-open" : ""}`}
        style={{
          background: theme.sidebar.container.background,
          color: "#FFFFFF", padding: "22px 15px 16px",
          borderRight: theme.sidebar.container.borderRight,
          boxShadow: theme.sidebar.container.boxShadow,
        }}
        aria-label="Menú principal"
      >
        <div style={{ padding: "4px 10px 20px", borderBottom: "1px solid rgba(255,255,255,.09)", marginBottom: 15 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg,#06B6D4,#2563EB)", display: "grid", placeItems: "center", fontSize: 21 }}>🎰</div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 900, letterSpacing: "-.35px" }}>Supervisión</div>
              <div style={{ fontSize: 10, color: "#94A3B8", letterSpacing: "1.6px", fontWeight: 800 }}>PANEL OPERATIVO</div>
            </div>
          </div>
        </div>

        <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 800, letterSpacing: "1.5px", padding: "0 13px 9px" }}>NAVEGACIÓN</div>
        <nav className="supervision-nav" aria-label="Módulos del sistema">
          {menu.map((item) => {
            const activo = item.ruta === "/" ? location.pathname === "/" :
              location.pathname === item.ruta || location.pathname.startsWith(`${item.ruta}/`);
            return (
              <Link
                key={item.ruta}
                to={item.ruta}
                className="supervision-nav-link"
                aria-current={activo ? "page" : undefined}
                style={{
                  ...theme.sidebar.link,
                  background: activo ? "linear-gradient(135deg,#0891B2,#2563EB)" : "rgba(255,255,255,.035)",
                  color: activo ? "#FFFFFF" : "#CBD5E1",
                  padding: "10px 12px", borderRadius: 11,
                  border: activo ? "1px solid rgba(125,211,252,.35)" : "1px solid transparent",
                  boxShadow: activo ? "0 5px 16px rgba(8,145,178,.20)" : "none",
                  fontWeight: activo ? 800 : 600,
                  fontSize: 12.5,
                }}
              >
                {item.nombre}
              </Link>
            );
          })}
        </nav>

        <div style={{ marginTop: "auto", paddingTop: 12, borderTop: "1px solid rgba(255,255,255,.09)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 10px", background: "rgba(255,255,255,.055)", borderRadius: 12 }}>
            <div style={{ width: 35, height: 35, borderRadius: 10, background: "rgba(6,182,212,.20)", color: "#67E8F9", display: "grid", placeItems: "center", fontWeight: 900, flexShrink: 0 }}>{inicial}</div>
            <div style={{ minWidth: 0 }}>
              <div title={nombreUsuario} style={{ fontWeight: 800, fontSize: 12.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{nombreUsuario}</div>
              <div style={{ color: "#94A3B8", fontSize: 11, textTransform: "capitalize" }}>{rol || "Sin rol"}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={cerrarSesion}
            disabled={cerrandoSesion}
            style={{ width: "100%", marginTop: 10, padding: "11px 12px", borderRadius: 11, background: "rgba(239,68,68,.12)", color: "#FCA5A5", border: "1px solid rgba(248,113,113,.22)", cursor: cerrandoSesion ? "wait" : "pointer", fontWeight: 800, fontSize: 12.5 }}
          >
            {cerrandoSesion ? "Cerrando sesión..." : "↪ Cerrar sesión"}
          </button>
        </div>
      </aside>

      <main className="supervision-main" style={{ background: theme.layout?.page?.background || theme.colors.background }}>
        <header className="supervision-topbar" style={{ minHeight: 68, padding: "13px 25px", background: "rgba(255,255,255,.94)", borderBottom: `1px solid ${theme.colors.border}`, display: "flex", alignItems: "center", gap: 14, boxSizing: "border-box" }}>
          <button
            className="supervision-menu-button"
            type="button"
            aria-label={menuMovilAbierto ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuMovilAbierto}
            onClick={() => setMenuMovilAbierto((v) => !v)}
          >☰</button>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 10, color: theme.colors.textLight, fontWeight: 800, letterSpacing: "1.2px" }}>SISTEMA DE SUPERVISIÓN</div>
            <div className="supervision-page-title" style={{ fontSize: 18, fontWeight: 850, color: theme.colors.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{moduloActual?.nombre || "Panel operativo"}</div>
          </div>
          <div style={{ marginLeft: "auto", color: theme.colors.textLight, fontSize: 12, fontWeight: 700, textAlign: "right" }}>{nombreUsuario}</div>
        </header>
        <div className="supervision-content" style={{ padding: 20 }}>{children}</div>
      </main>
    </div>
  );
}

export default MainLayout;
