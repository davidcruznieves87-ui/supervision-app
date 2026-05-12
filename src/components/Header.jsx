
import { signOut } from "firebase/auth";
import theme
from "../styles/theme";
import { auth } from "../firebase";

import logo from "../logo.png";

function Header({

  online,

  esSuperSupervisor,

  mostrarAdmin,

  setMostrarAdmin,

  supervisor,

}) {

 return (

  <div style={{

    ...theme.card,

    display: "flex",

    justifyContent: "space-between",

    alignItems: "center",

    marginBottom: "20px",

  }}>

    {/* IZQUIERDA */}
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "16px",
    }}>

      <img
        src={logo}
        alt="logo"
        style={{
          width: "90px",
          height: "90px",
          borderRadius: "50%",
          objectFit: "cover",
        }}
      />

      <div>

        <h1 style={{
          margin: 0,
          color: theme.colors.text,
        }}>

          Sistema de Supervisión

        </h1>

        <p style={{
          color: theme.colors.textLight,
          marginTop: "6px",
        }}>

          Equipo Técnico {supervisor}

        </p>

      </div>

    </div>

    {/* DERECHA */}
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-end",
      gap: "10px",
    }}>

      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }}>

        <div style={{
          width: "12px",
          height: "12px",
          borderRadius: "50%",
          background:
            online
              ? theme.colors.success
              : theme.colors.error,
        }} />

        <span>

          {online
            ? "Conectado a internet"
            : "Modo offline"
          }

        </span>

      </div>

    </div>

  </div>
);
}

export default Header;