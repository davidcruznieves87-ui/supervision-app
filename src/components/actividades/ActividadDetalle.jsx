    import {
    useState,
    useEffect,
    } from "react";

    import theme
    from "../../styles/theme";
import MaterialCard
from "./MaterialCard";

import TecnicosCard
from "./TecnicosCard";

import ClienteCard
from "./ClienteCard";

import ProgramacionCard
from "./ProgramacionCard";

import EjecucionCard
from "./EjecucionCard";

    import useAuth
    from "../../hooks/useAuth";

    function ActividadDetalle({ 

    actividad,

    tecnicos,

    onGuardar,

    }) {
    const { usuario } =
    useAuth();    

    const [datos, setDatos] =
    useState(null);

    useEffect(() => {

    setDatos(actividad);

    }, [actividad]);

    if (!actividad || !datos)
    return null;

    const confirmarEquipo =
    () => {

        setDatos({

        ...datos,

        tecnicosConfirmados:
            true,

        tecnicosConfirmadoPor:
            usuario?.nombre ||
            "Sistema",

        tecnicosConfirmadoFecha:
            new Date()
            .toISOString(),

        });
    };

    const desbloquearEquipo =
    () => {

        setDatos({

        ...datos,

        tecnicosConfirmados:
            false,

        tecnicosConfirmadoPor:
            null,

        tecnicosConfirmadoFecha:
            null,

        });
    };

    console.log(
    "TECNICOS GUARDADOS:",
    datos.tecnicosAsignados
    );

    console.log(
    "TECNICOS DISPONIBLES:",
    tecnicos
    );

    const confirmarMaterial =
    () => {

        setDatos({

        ...datos,

        materialConfirmado:
            true,

        materialConfirmadoPor:
            usuario?.nombre ||
            "Sistema",

        materialConfirmadoFecha:
            new Date()
            .toISOString(),

        });
    };

    const desbloquearMaterial =
    () => {

        setDatos({

        ...datos,

        materialConfirmado:
            false,

        materialConfirmadoPor:
            null,

        materialConfirmadoFecha:
            null,

        });
    };

    const confirmarCliente =
    () => {

        setDatos({

        ...datos,

        clienteConfirmado:
            true,

        clienteConfirmadoPor:
            usuario?.nombre ||
            "Sistema",

        clienteConfirmadoFecha:
            new Date()
            .toISOString(),

        });
    };

    const desbloquearCliente =
    () => {

        setDatos({

        ...datos,

        clienteConfirmado:
            false,

        clienteConfirmadoPor:
            null,

        clienteConfirmadoFecha:
            null,

        });
    };
const confirmarProgramacion = () => {

  setDatos({

    ...datos,

    programacionConfirmada: true,

    programacionConfirmadoPor:
      usuario?.nombre || "Sin Usuario",

    programacionConfirmadoFecha:
      new Date().toLocaleString(),

  });

};

const desbloquearProgramacion = () => {

  setDatos({

    ...datos,

    programacionConfirmada: false,

    programacionConfirmadoPor: null,

    programacionConfirmadoFecha: null,

  });

};

const confirmarEjecucion = () => {

  setDatos({

    ...datos,

    ejecucionConfirmada: true,

    ejecucionConfirmadoPor:
      usuario?.nombre || "Sin Usuario",

    ejecucionConfirmadoFecha:
      new Date().toLocaleString(),

  });

};

const desbloquearEjecucion = () => {

  setDatos({

    ...datos,

    ejecucionConfirmada: false,

    ejecucionConfirmadoPor: null,

    ejecucionConfirmadoFecha: null,

  });

};


    const toggleTecnico =
        (nombreTecnico) => {

        const actuales =
            datos.tecnicosAsignados || [];

        const existe =
            actuales.includes(
            nombreTecnico
            );

        setDatos({

            ...datos,

            tecnicosAsignados:
            existe

                ? actuales.filter(
                    t =>
                    t !== nombreTecnico
                )

                : [
                    ...actuales,
                    nombreTecnico,
                ],

        });
        };

    return (

        <div
    style={{
        ...theme.card,

        color:
        theme.colors.text,
    }}
    >
<div
  style={{
    display: "flex",
    alignItems: "center",
    gap: 15,
    marginBottom: 20,
  }}
>

  <div
    style={{
      width: 60,
      height: 60,
      borderRadius: "50%",
      background: "#EEF2FF",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 30,
    }}
  >
    📋
  </div>

  <div>

    <h2
      style={{
        margin: 0,
        color: theme.colors.text,
        fontWeight: 900,
      }}
    >
      Seguimiento Actividad
    </h2>

    <div
      style={{
        color: theme.colors.textLight,
        marginTop: 4,
      }}
    >
      Control operativo y seguimiento
    </div>

  </div>

</div>

<hr
  style={{
    border: "none",
    borderTop: `1px solid ${theme.colors.border}`,
    marginBottom: 24,
  }}
/>

<div
  style={{
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(220px,1fr))",
    gap: 20,
    marginBottom: 30,
  }}
>

  <div>

    <div
      style={{
        fontSize: 12,
        color: theme.colors.textLight,
        marginBottom: 4,
      }}
    >
      AF
    </div>

    <div
      style={{
        fontSize: 24,
        fontWeight: 800,
        color: "#2563EB",
      }}
    >
      {datos.af}
    </div>

  </div>

  <div>

    <div
      style={{
        fontSize: 12,
        color: theme.colors.textLight,
        marginBottom: 4,
      }}
    >
      Sala
    </div>

    <div
      style={{
        fontSize: 22,
        fontWeight: 700,
      }}
    >
      {datos.sala}
    </div>

  </div>

  <div>

    <div
      style={{
        fontSize: 12,
        color: theme.colors.textLight,
        marginBottom: 4,
      }}
    >
      Tipo Actividad
    </div>

    <div
      style={{
        fontSize: 20,
        fontWeight: 700,
      }}
    >
      {datos.tipoActividad}
    </div>

  </div>

  <div>

    <div
      style={{
        fontSize: 12,
        color: theme.colors.textLight,
        marginBottom: 4,
      }}
    >
      Cliente
    </div>

    <div
      style={{
        fontSize: 20,
        fontWeight: 700,
      }}
    >
      {datos.cliente || "-"}
    </div>

  </div>

</div>

{/* RESUMEN AF */}

<div
  style={{
    border: `1px solid ${theme.colors.border}`,
    borderRadius: 18,
    padding: 20,
    marginTop: 20,
    background: "#F8FAFC",
  }}
>

  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      marginBottom: 20,
    }}
  >

    <div
      style={{
        width: 48,
        height: 48,
        borderRadius: "50%",
        background: "#EEF2FF",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 24,
      }}
    >
      📄
    </div>

    <h3
      style={{
        margin: 0,
      }}
    >
      Resumen AF
    </h3>

  </div>

  <div
    style={{
      display: "grid",
      gridTemplateColumns:
        "repeat(auto-fit,minmax(250px,1fr))",
      gap: 15,
    }}
  >

    <div>
      <strong>AF:</strong>
      <br />
      {datos.af}
    </div>

    <div>
      <strong>Sala:</strong>
      <br />
      {datos.sala}
    </div>

    <div>
      <strong>Cliente:</strong>
      <br />
      {datos.cliente}
    </div>

    <div>
      <strong>Actividad:</strong>
      <br />
      {datos.tipoActividad}
    </div>

    <div>
      <strong>Solicitante:</strong>
      <br />
      {datos.solicitante}
    </div>

    <div>
      <strong>Contacto:</strong>
      <br />
      {datos.contacto}
    </div>

    <div>
      <strong>Correo:</strong>
      <br />
      {datos.correo}
    </div>

    <div>
      <strong>Fecha Límite:</strong>
      <br />
      {datos.fechaLimite}
    </div>

    <div>
      <strong>Protocolo:</strong>
      <br />
      {datos.protocolo}
    </div>

  </div>

</div>

{/* TERMINALES */}
{/* TERMINALES */}

{datos.terminales?.length > 0 && (

  <div
    style={{
      border: `1px solid ${theme.colors.border}`,
      borderRadius: 18,
      padding: 20,
      marginTop: 20,
      background: "#F8FAFC",
    }}
  >

    {/* ENCABEZADO */}

    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        marginBottom: 20,
      }}
    >

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >

        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: "#EEF2FF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
          }}
        >
          🎰
        </div>

        <div>

          <h3
            style={{
              margin: 0,
            }}
          >
            Terminales
          </h3>

          <div
            style={{
              fontSize: 12,
              color: theme.colors.textLight,
              marginTop: 3,
            }}
          >
            Cambios indicados en la AF
          </div>

        </div>

      </div>


      {/* CONTADOR */}

      <div
        style={{
          background: "#E2E8F0",
          borderRadius: 20,
          padding: "5px 12px",
          fontSize: 12,
          fontWeight: 800,
          color: theme.colors.text,
        }}
      >
        {datos.terminales.length}
      </div>

    </div>


    {/* GRID TERMINALES */}

    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(auto-fit,minmax(280px,1fr))",
        gap: 12,
      }}
    >

      {datos.terminales.map(
        (terminal, index) => {

          const tieneCambio =
            Boolean(
              terminal.juegoNuevo
            );

          return (

            <div
              key={
                `${terminal.sn}-${index}`
              }
              style={{
                background: "#FFFFFF",
                border:
                  "1px solid #E2E8F0",
                borderRadius: 12,
                padding: 15,
              }}
            >

              {/* DATOS TERMINAL */}

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "6px 16px",
                  fontSize: 13,
                }}
              >

                <div>
                  <strong>
                    SN:
                  </strong>{" "}
                  {terminal.sn || "-"}
                </div>


                <div>
                  <strong>
                    VLT:
                  </strong>{" "}
                  {terminal.vlt || "-"}
                </div>


                <div>
                  <strong>
                    LOC:
                  </strong>{" "}
                  {terminal.loc || "-"}
                </div>

              </div>


              {/* CAMBIO DE JUEGO */}

              {terminal.juegoActual && (

                <div
                  style={{
                    marginTop: 12,
                    paddingTop: 12,
                    borderTop:
                      "1px solid #E2E8F0",
                  }}
                >

                  <div
                    style={{
                      fontSize: 11,
                      color:
                        theme.colors.textLight,
                      marginBottom: 6,
                      fontWeight: 700,
                      textTransform:
                        "uppercase",
                    }}
                  >
                    {tieneCambio
                      ? "Cambio de juego"
                      : "Juego actual"}
                  </div>


                  {tieneCambio ? (

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: 8,
                        fontWeight: 800,
                        fontSize: 14,
                        lineHeight: 1.4,
                      }}
                    >

                      {/* JUEGO ACTUAL */}

                      <span>
                        {
                          terminal.juegoActual
                        }
                      </span>


                      {/* FLECHA */}

                      <span
                        style={{
                          color:
                            theme.colors.primary ||
                            "#06B6D4",
                          fontSize: 18,
                          fontWeight: 900,
                        }}
                      >
                        →
                      </span>


                      {/* JUEGO NUEVO */}

                      <span
                        style={{
                          color:
                            theme.colors.primary ||
                            "#06B6D4",
                        }}
                      >
                        {
                          terminal.juegoNuevo
                        }
                      </span>

                    </div>

                  ) : (

                    /*
                    Para RETIRO TOTAL u otra AF
                    donde no existe juego nuevo.
                    */

                    <div
                      style={{
                        fontWeight: 800,
                        fontSize: 14,
                      }}
                    >
                      {
                        terminal.juegoActual
                      }
                    </div>

                  )}

                </div>

              )}

            </div>

          );

        }
      )}

    </div>

  </div>

)}

{/* INDICACIONES ESPECIALES */}

{datos.indicacionesEspeciales && (

  <div
    style={{
      border: `1px solid ${theme.colors.border}`,
      borderRadius: 18,
      padding: 20,
      marginTop: 20,
      background: "#F8FAFC",
    }}
  >

    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        marginBottom: 20,
      }}
    >

      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          background: "#EEF2FF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 24,
        }}
      >
        📋
      </div>

      <h3
        style={{
          margin: 0,
        }}
      >
        Indicaciones Especiales
      </h3>

    </div>

    <div
      style={{
        background: "#fff",
        border:
          "1px solid #E2E8F0",
        borderRadius: 12,
        padding: 16,
        whiteSpace: "pre-wrap",
        lineHeight: 1.6,
      }}
    >
      {datos.indicacionesEspeciales}
    </div>

  </div>

)}
        
<MaterialCard

  datos={datos}

  setDatos={setDatos}

  confirmarMaterial={
    confirmarMaterial
  }

  desbloquearMaterial={
    desbloquearMaterial
  }

/>

       <TecnicosCard

  datos={datos}

  setDatos={setDatos}

  tecnicos={tecnicos}

  toggleTecnico={
    toggleTecnico
  }

  confirmarEquipo={
    confirmarEquipo
  }

  desbloquearEquipo={
    desbloquearEquipo
  }

/>


<ProgramacionCard

  datos={datos}

  setDatos={setDatos}

  confirmarProgramacion={
    confirmarProgramacion
  }

  desbloquearProgramacion={
    desbloquearProgramacion
  }

/>


        <ClienteCard

  datos={datos}

  setDatos={setDatos}

  confirmarCliente={
    confirmarCliente
  }

  desbloquearCliente={
    desbloquearCliente
  }

/>

     

        <EjecucionCard

  datos={datos}

  setDatos={setDatos}

  confirmarEjecucion={
    confirmarEjecucion
  }

  desbloquearEjecucion={
    desbloquearEjecucion
  }

/>

        <button
    onClick={() =>
        onGuardar(datos)
    }
    style={{
        ...theme.button.success,
        width: "100%",
        marginTop: 20,
    }}
    >
    💾 Guardar Seguimiento
    </button>
        </div>
    );
    }

    export default ActividadDetalle;