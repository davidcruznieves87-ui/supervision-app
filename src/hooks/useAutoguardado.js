import { useEffect } from "react";

export default function useAutoguardado({

  sitio,
  tecnico,
  fallas,

  setSitio,
  setTecnico,
  setFallas,

  setMensaje,

}) {

  // 🔥 RECUPERAR
  useEffect(() => {

    const borrador =
      localStorage.getItem(
        "supervision_borrador"
      );

    if (borrador) {

      try {

        const datos =
          JSON.parse(borrador);

        setSitio(
          datos.sitio || ""
        );

        setTecnico(
          datos.tecnico || ""
        );

        setFallas(
          datos.fallas || []
        );

        setMensaje(
          "♻️ Borrador recuperado"
        );

        setTimeout(() => {
          setMensaje("");
        }, 3000);

      } catch (error) {

        console.log(error);
      }
    }

  }, []);

  // 🔥 AUTOGUARDAR
  useEffect(() => {

    if (
      !sitio &&
      !tecnico &&
      fallas.length === 0
    ) {
      return;
    }

    const borrador = {
      sitio,
      tecnico,
      fallas,
    };

    localStorage.setItem(
      "supervision_borrador",
      JSON.stringify(borrador)
    );

  }, [sitio, tecnico, fallas]);
}