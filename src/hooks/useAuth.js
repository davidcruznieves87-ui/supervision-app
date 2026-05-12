import {
  useEffect,
  useState,
} from "react";

import {
  onAuthStateChanged,
} from "firebase/auth";

import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import {
  auth,
  db,
} from "../firebase";

export default function useAuth() {

  const [
    supervisor,
    setSupervisor,
  ] = useState("");

  const [
    rol,
    setRol,
  ] = useState("");

  const [
    esAdmin,
    setEsAdmin,
  ] = useState(false);

  const [
    esSuperAdmin,
    setEsSuperAdmin,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(true);

  useEffect(() => {

    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (user) => {

          if (user) {

            setSupervisor(
              user.email
            );

            try {

              // 🔥 BUSCAR USUARIO
              const q = query(
                collection(
                  db,
                  "usuarios"
                ),
                where(
                  "correo",
                  "==",
                  user.email
                )
              );

              const snapshot =
                await getDocs(q);

              if (
                !snapshot.empty
              ) {

                const datos =
                  snapshot.docs[0].data();

                setRol(
                  datos.rol
                );

                // 🔥 ADMIN
                setEsAdmin(
                  datos.rol ===
                    "admin" ||
                  datos.rol ===
                    "superadmin"
                );

                // 🔥 SUPERADMIN
                setEsSuperAdmin(
                  datos.rol ===
                    "superadmin"
                );

              } else {

                setRol(
                  "supervisor"
                );

                setEsAdmin(false);

                setEsSuperAdmin(
                  false
                );
              }

            } catch (error) {

              console.log(error);
            }

          } else {

            setSupervisor("");

            setRol("");

            setEsAdmin(false);

            setEsSuperAdmin(
              false
            );
          }

          setLoading(false);
        }
      );

    return () => unsubscribe();

  }, []);

  return {

    supervisor,

    rol,

    esAdmin,

    esSuperAdmin,

    loading,

  };
}