import {
  Navigate,
} from "react-router-dom";

import useAuth from "../hooks/useAuth";

export default function ProtectedRoute({

  children,

  allowedRoles = [],

}) {

  const {

    usuario,

    loading,

  } = useAuth();

  // 🔥 CARGANDO
  if (loading) {

    return (

      <div className="flex items-center justify-center min-h-screen text-3xl font-black text-cyan-700">

        🔄 Cargando...

      </div>

    );
  }

  // 🔥 NO LOGUEADO
  if (!usuario) {

    return <Navigate to="/" />;
  }

  // 🔥 NORMALIZAR ROL
  const rol = (
    usuario?.rol || ""
  )
    .toLowerCase()
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    );

  // 🔥 VALIDAR ROLES
  if (

    allowedRoles.length > 0 &&

    !allowedRoles.includes(
      rol
    )

  ) {

    return <Navigate to="/" />;
  }

  return children;
}