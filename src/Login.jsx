import { useState } from "react";
import theme from "./styles/theme";
import {
  signInWithEmailAndPassword,
} from "firebase/auth";

import {
  auth,
} from "./firebase";

import logo from "./logo.png";

function Login() {

  const [correo, setCorreo] = useState("");

  const [password, setPassword] = useState("");

  const [mensaje, setMensaje] = useState("");

  const iniciarSesion = async () => {

    try {

      await signInWithEmailAndPassword(
        auth,
        correo,
        password
      );

    } catch (error) {

      console.log(error);

      setMensaje(
        "❌ Usuario o contraseña incorrectos"
      );
    }
  };

  return (
<div style={{
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background: theme.colors.background,
}}>

  <div style={{
    ...theme.card,
    width: "400px",
  }}>

    <h1 style={theme.title}>
      Sistema de Supervisión
    </h1>

    <input
  type="email"
  placeholder="Correo"
  value={correo}
  onChange={(e) =>
    setCorreo(e.target.value)
  }
  style={theme.input}
/>

  <input
  type="password"
  placeholder="Contraseña"
  value={password}
  onChange={(e) =>
    setPassword(e.target.value)
  }
  style={theme.input}
/>

   <button
  onClick={iniciarSesion}
  style={{
    ...theme.button.primary,
    width: "100%",
  }}
>

  Iniciar sesión

</button>

  </div>

</div>


  );
}

export default Login;