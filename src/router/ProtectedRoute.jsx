import {
  Navigate,
} from "react-router-dom";

import useAuth from "../hooks/useAuth";

export default function ProtectedRoute({

  children,

  requireAdmin = false,

  requireSuperAdmin = false,

}) {

  const {

    supervisor,

    esAdmin,

    esSuperAdmin,

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
  if (!supervisor) {

    return <Navigate to="/" />;
  }

  // 🔥 SOLO ADMIN
  if (
    requireAdmin &&
    !esAdmin
  ) {

    return <Navigate to="/" />;
  }

  // 🔥 SOLO SUPERADMIN
  if (
    requireSuperAdmin &&
    !esSuperAdmin
  ) {

    return <Navigate to="/" />;
  }

  return children;
}