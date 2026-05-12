import {
  useEffect,
  useState,
} from "react";

import AppRouter
from "./router/AppRouter";

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
} from "./firebase";

function App() {

  const [usuario, setUsuario] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  // 🔥 AUTH
  useEffect(() => {

    const unsubscribe =

      onAuthStateChanged(
        auth,

        async (userAuth) => {

          // 🔥 NO LOGIN
          if (!userAuth) {

            setUsuario(null);

            setLoading(false);

            return;
          }

          try {

            // 🔥 FIRESTORE
            const docRef =

              doc(
                db,
                "usuarios",
                userAuth.uid
              );

            const docSnap =

              await getDoc(
                docRef
              );

            // 🔥 EXISTE
            if (
              docSnap.exists()
            ) {

              setUsuario({

                uid:
                  userAuth.uid,

                ...docSnap.data(),
              });

            } else {

              setUsuario({
                uid:
                  userAuth.uid,
              });
            }

          } catch (error) {

            console.log(error);
          }

          setLoading(false);
        }
      );

    return () =>
      unsubscribe();

  }, []);

  // 🔥 LOADING
  if (loading) {

    return (

      <div
        style={{

          height: "100vh",

          display: "flex",

          alignItems:
            "center",

          justifyContent:
            "center",

          background:
            "#0F172A",

          color: "white",

          fontSize: "22px",
        }}
      >

        Cargando sistema...

      </div>
    );
  }

  return (

    <AppRouter
      usuario={usuario}
    />

  );
}

export default App;