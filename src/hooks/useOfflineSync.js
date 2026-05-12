import { useEffect, useState } from "react";

import {
  guardarSupervisionDB,
} from "../services/supervisionesService";

export default function useOfflineSync({

  cargarSupervisiones,
  setMensaje,

}) {

  const [online, setOnline] =
    useState(navigator.onLine);

  useEffect(() => {

    const actualizarEstado =
      async () => {

        setOnline(
          navigator.onLine
        );

        // 🔥 SI VOLVIÓ INTERNET
        if (navigator.onLine) {

          const pendientes =
            JSON.parse(
              localStorage.getItem(
                "supervisiones_pendientes"
              ) || "[]"
            );

          if (pendientes.length > 0) {

            try {

              for (const supervision of pendientes) {

                await guardarSupervisionDB(
                  supervision
                );
              }

              localStorage.removeItem(
                "supervisiones_pendientes"
              );

              cargarSupervisiones();

              setMensaje(
                `☁️ ${pendientes.length} supervisión(es) sincronizada(s)`
              );

              setTimeout(() => {

                setMensaje("");

              }, 4000);

            } catch (error) {

              console.log(error);
            }
          }
        }
      };

    window.addEventListener(
      "online",
      actualizarEstado
    );

    window.addEventListener(
      "offline",
      actualizarEstado
    );

    return () => {

      window.removeEventListener(
        "online",
        actualizarEstado
      );

      window.removeEventListener(
        "offline",
        actualizarEstado
      );
    };

  }, []);

  return {
    online,
  };
}