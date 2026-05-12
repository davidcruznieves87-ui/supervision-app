import {  createContext,  useContext,  useState,} from "react";


const SupervisionContext =
  createContext();

export const SupervisionProvider =
  ({ children }) => {

    const [
      sitio,
      setSitio,
    ] = useState("");

    const [
      tecnico,
      setTecnico,
    ] = useState("");

    const [
      fallas,
      setFallas,
    ] = useState([]);

    const [
      mensaje,
      setMensaje,
    ] = useState("");

    return (

      <SupervisionContext.Provider
        value={{

          sitio,
          setSitio,

          tecnico,
          setTecnico,

          fallas,
          setFallas,

          mensaje,
          setMensaje,

        }}
      >

        {children}

      </SupervisionContext.Provider>
    );
};

export const useSupervision =
  () => {

    return useContext(
      SupervisionContext
    );
};