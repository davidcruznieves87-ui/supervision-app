import {
  useEffect,
  useState,
} from "react";

import {
  onAuthStateChanged,
} from "firebase/auth";

import {
  auth,
} from "../firebase";

export default function useAuth() {

  const [
    supervisor,
    setSupervisor,
  ] = useState("");

  const [
    esAdmin,
    setEsAdmin,
  ] = useState(false);

  const [
    esSuperSupervisor,
    setEsSuperSupervisor,
  ] = useState(false);

  useEffect(() => {

    const unsubscribe =
      onAuthStateChanged(
        auth,
        (user) => {

          if (user) {

            setSupervisor(
              user.email
            );

            // 🔥 ADMIN
            if (
              user.email ===
              "admin@casino.com"
            ) {

              setEsAdmin(true);

            } else {

              setEsAdmin(false);
            }

            // 🔥 SUPER SUPERVISORES
          const superUsuarios = [

  "gerencia@casino.com",

  "acruz@fbmgaming.com.mx",

  "vgarciapina@fbmgaming.com.mx",

  "david.cruz@fbmgaming.com.mx",

];

            if (
              superUsuarios.includes(
                user.email
              )
            ) {

              setEsSuperSupervisor(
                true
              );

            } else {

              setEsSuperSupervisor(
                false
              );
            }
          }
        }
      );

    return () => unsubscribe();

  }, []);

  return {

    supervisor,

    esAdmin,

    esSuperSupervisor,

  };
}