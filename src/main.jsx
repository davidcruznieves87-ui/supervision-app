import {
  SupervisionProvider,
} from "./context/SupervisionContext";

import React from "react";

import ReactDOM from "react-dom/client";

import "./index.css";

import App from "./App";

import Login from "./Login";

import {
  auth,
  db,
} from "./firebase";

import {
  onAuthStateChanged,
} from "firebase/auth";

import {
  doc,
  getDoc,
} from "firebase/firestore";

const root = ReactDOM.createRoot(
  document.getElementById("root")
);

function Root() {

  const [usuario, setUsuario] =
    React.useState(undefined);

  React.useEffect(() => {

    const unsubscribe =

      onAuthStateChanged(

        auth,

        async (userAuth) => {

          console.log(
            "AUTH USER:",
            userAuth
          );

          if (!userAuth) {

            setUsuario(null);

            return;
          }

          try {

            console.log(
              "UID AUTH:",
              userAuth.uid
            );

            const ref = doc(
              db,
              "usuarios",
              userAuth.uid
            );

            const snap =
              await getDoc(ref);

            console.log(
              "DOC EXISTS:",
              snap.exists()
            );

            console.log(
              "DOC DATA:",
              snap.data()
            );

            if (snap.exists()) {

              setUsuario({

                uid:
                  userAuth.uid,

                ...snap.data(),
              });

            } else {

              setUsuario({
                uid:
                  userAuth.uid,
              });
            }

          } catch (error) {

            console.log(
              "ERROR FIRESTORE:",
              error
            );

            setUsuario(null);
          }
        }
      );

    return () =>
      unsubscribe();

  }, []);

  if (
    usuario === undefined
  ) {

    return (
      <div>
        Cargando...
      </div>
    );
  }

  return usuario ? (

    <SupervisionProvider>

      <App
        usuario={usuario}
      />

    </SupervisionProvider>

  ) : (

    <Login />

  );
}

root.render(

  <React.StrictMode>

    <Root />

  </React.StrictMode>
);