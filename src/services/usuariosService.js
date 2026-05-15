import {
  initializeApp,
  getApps,
} from "firebase/app";

import {
  getAuth,
  createUserWithEmailAndPassword,
} from "firebase/auth";

import {
  doc,
  setDoc,
  collection,
  getDocs,
} from "firebase/firestore";

import {
  db,
} from "../firebase";

// 🔥 CONFIG FIREBASE
const firebaseConfig = {

  apiKey:
    import.meta.env
      .VITE_FIREBASE_API_KEY,

  authDomain:
    import.meta.env
      .VITE_FIREBASE_AUTH_DOMAIN,

  projectId:
    import.meta.env
      .VITE_FIREBASE_PROJECT_ID,

  storageBucket:
    import.meta.env
      .VITE_FIREBASE_STORAGE_BUCKET,

  messagingSenderId:
    import.meta.env
      .VITE_FIREBASE_MESSAGING_SENDER_ID,

  appId:
    import.meta.env
      .VITE_FIREBASE_APP_ID,
};

// 🔥 APP SECUNDARIA
const secondaryApp =

  getApps().find(
    (app) =>
      app.name === "Secondary"
  )

  ||

  initializeApp(
    firebaseConfig,
    "Secondary"
  );

// 🔥 AUTH SECUNDARIA
const secondaryAuth =
  getAuth(
    secondaryApp
  );

// 🔥 CREAR USUARIO
export const crearUsuario =
  async ({

    nombre,

    email,

    password,

    rol,

    supervisor = "",

    sitiosAsignados = [],

  }) => {

    try {

      console.log(
        "Creando usuario..."
      );

      // 🔥 AUTH
      const credenciales =

        await createUserWithEmailAndPassword(

          secondaryAuth,

          email,

          password

        );

      const uid =
        credenciales.user.uid;

      console.log(
        "UID:",
        uid
      );

      // 🔥 FIRESTORE
      await setDoc(

        doc(
          db,
          "usuarios",
          uid
        ),

        {

          uid,

          nombre,

          email,

          rol,

          supervisor,

          sitiosAsignados,

          activo: true,

          fechaCreacion:
            new Date(),

        }
      );

      // 🔥 TECNICO
      if (

  (
    rol || ""
  )
    .toLowerCase()
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    ) === "tecnico"
) {

        await setDoc(

          doc(
            db,
            "tecnicos",
            uid
          ),

          {

            uid,

            nombre,

            email,

            supervisor,

            sitiosAsignados,

            activo: true,

            fechaCreacion:
              new Date(),

          }
        );
      }

      console.log(
        "Usuario guardado en Firestore"
      );

      // 🔥 CERRAR SESION SECUNDARIA
      await secondaryAuth.signOut();

      return {

        ok: true,
      };

    } catch (error) {

      console.error(
        "ERROR CREANDO USUARIO:",
        error
      );

      alert(
        error.message
      );

      return {

        ok: false,

        error:
          error.message,
      };
    }
  };

// 🔥 OBTENER USUARIOS
export const obtenerUsuarios =
  async () => {

    try {

      const snapshot =

        await getDocs(
          collection(
            db,
            "usuarios"
          )
        );

      const usuarios =

        snapshot.docs.map(
          (doc) => ({

            id: doc.id,

            ...doc.data(),
          })
        );

      return usuarios;

    } catch (error) {

      console.error(
        "ERROR OBTENIENDO USUARIOS:",
        error
      );

      return [];
    }
  };