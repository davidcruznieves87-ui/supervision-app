import {
  Link,
  Outlet,
} from "react-router-dom";
import theme from "../styles/theme";
import {
  signOut,
} from "firebase/auth";

import {
  auth,
} from "../firebase";

export default function MainLayout() {

  const cerrarSesion =
    async () => {

      try {

        await signOut(auth);

      } catch (error) {

        console.log(error);
      }
    };

  return (

  <div style={{
    display: "flex",
    minHeight: "100vh",
    background: theme.colors.background,
  }}>

    <aside style={theme.sidebar.container}>

      <h2 style={{
        margin: 0,
        fontSize: "28px",
      }}>
        🎰 Sistema
      </h2>

      <nav style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}>

        <Link
          to="/"
          style={theme.sidebar.link}
        >
          Dashboard
        </Link>

        <Link
          to="/admin"
          style={theme.sidebar.link}
        >
          Administración
        </Link>
        <Link
  to="/supervisiones"
  style={theme.sidebar.link}
>
  Supervisiones
</Link>

<Link
  to="/historial"
  style={theme.sidebar.link}
>
  Historial
</Link>

<Link
  to="/ejecutivo"
  style={theme.sidebar.link}
>
  Ejecutivo
</Link>


      </nav>

      <button
        onClick={cerrarSesion}
        style={theme.button.danger}
      >
        Cerrar sesión
      </button>

    </aside>

    <main style={{
      flex: 1,
      padding: "20px",
    }}>

      <Outlet />

    </main>

  </div>
);
}