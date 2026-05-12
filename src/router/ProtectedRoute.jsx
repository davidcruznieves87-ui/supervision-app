import {
  Navigate,
} from "react-router-dom";

import {
  auth,
} from "../firebase";

export default function ProtectedRoute({

  children,

  requireAdmin = false,

}) {

  const user =
    auth.currentUser;

  // 🔥 ESPERAR LOGIN
  if (!user) {

    return (
      <div>
        Cargando...
      </div>
    );
  }

  // 🔥 SUPER USUARIOS
  const superUsuarios = [

    "gerencia@casino.com",

    "acruz@fbmgaming.com.mx",

    "vgarciapina@fbmgaming.com.mx",

    // TU CORREO
    user.email,
  ];

  const autorizado =
    superUsuarios.includes(
      user.email
    );

  // 🔥 BLOQUEAR
  if (
    requireAdmin &&
    !autorizado
  ) {

    return <Navigate to="/" />;
  }

  return children;
}