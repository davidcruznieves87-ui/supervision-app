import {
  useEffect,
  useState,
} from "react";

import {
  onAuthStateChanged,
} from "firebase/auth";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import {
  auth,
  db,
} from "../firebase";

export default function useAuth() {

  const [
    usuario,
    setUsuario,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  useEffect(() => {

    const unsubscribe =

      onAuthStateChanged(

        auth,

        async (user) => {

          try {

            // 🔥 NO LOGUEADO
            if (!user) {

              setUsuario(null);

              setLoading(false);

              return;
            }

            // 🔥 BUSCAR USUARIO FIRESTORE
            const ref = doc(
              db,
              "usuarios",
              user.uid
            );

            const snap =
              await getDoc(ref);

            // 🔥 EXISTE
            if (snap.exists()) {

              const datos =
                snap.data();

              setUsuario({

                uid: user.uid,

                email: user.email,

                ...datos,

              });

            } else {

              // 🔥 FALLBACK
              setUsuario({

                uid: user.uid,

                email: user.email,

                rol: "supervisor",

              });
            }

          } catch (error) {

            console.error(
              "ERROR AUTH:",
              error
            );

            setUsuario(null);

          } finally {

            setLoading(false);
          }
        }
      );

    return () => unsubscribe();

  }, []);

  return {

    usuario,

    loading,

  };
}