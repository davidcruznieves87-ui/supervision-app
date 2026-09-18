import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  calcularResumenSemanalNomina,
} from "../services/nomina/resumenSemanalNomina";

import {
  obtenerNominaAbierta,
  guardarNominaAbiertaDB,
  cerrarNominaDB,
  obtenerHistorialNominas,
  obtenerNominaHistorial,
  timestampATexto,
} from "../services/nomina/nominaFirestore";

import {
  generarPDFNominaHistorica,
} from "../services/nomina/pdfNomina";

import theme from "../styles/theme";

import {
  leerArchivoXLS,
} from "../services/nomina/parserNomina";

import {
  procesarRegistros,
  crearFechaLocal,
  fechaISO,
  fechaVisual,
  nombreDia,
  segundosAHoras,
} from "../services/nomina/calculoHoras";

import {
  calcularAsistenciaNomina,
} from "../services/nomina/asistenciaNomina";

import {
  obtenerTecnicosNomina,
  sincronizarTecnicosDesdeXLS,
  guardarFechasTecnico,
  cambiarEstadoTecnico,
} from "../services/nomina/tecnicosNomina";

import {
  obtenerFestivosAnio,
  guardarFestivosAnio,
  obtenerFestivosPeriodo,
} from "../services/nomina/festivosNomina";


// =====================================================
// UTILIDADES
// =====================================================

const fechaHoraVisual = (fecha) => {
  return timestampATexto(fecha);
};

const obtenerHoyISO = () => {
  return fechaISO(new Date());
};


const obtenerAnioActual = () => {
  return new Date().getFullYear();
};


// =====================================================
// COMPONENTE
// =====================================================

function NominaPage() {

  const [
    registros,
    setRegistros,
  ] = useState([]);

  const [
    nombreArchivo,
    setNombreArchivo,
  ] = useState("");

  const [
    nominaAbierta,
    setNominaAbierta,
  ] = useState(null);

  const [
    tecnicosCatalogo,
    setTecnicosCatalogo,
  ] = useState([]);

  const [
    edicionTecnicos,
    setEdicionTecnicos,
  ] = useState({});

  const [
    vista,
    setVista,
  ] = useState("nomina");


  // ===================================================
  // HISTORIAL
  // ===================================================

  const [
    historialNominas,
    setHistorialNominas,
  ] = useState([]);

  const [
    nominaHistorica,
    setNominaHistorica,
  ] = useState(null);

  const [
    cargandoHistorial,
    setCargandoHistorial,
  ] = useState(false);

  const [
    cargandoDetalleHistorial,
    setCargandoDetalleHistorial,
  ] = useState(false);


  // ===================================================
  // FESTIVOS
  // ===================================================

  const [
    configuracionesFestivos,
    setConfiguracionesFestivos,
  ] = useState([]);

  const [
    aniosSinConfigurar,
    setAniosSinConfigurar,
  ] = useState([]);

  const [
    anioFestivos,
    setAnioFestivos,
  ] = useState(
    obtenerAnioActual()
  );

  const [
    festivosEdicion,
    setFestivosEdicion,
  ] = useState([]);

  const [
    festivosConfigurados,
    setFestivosConfigurados,
  ] = useState(false);

  const [
    nuevaFechaFestivo,
    setNuevaFechaFestivo,
  ] = useState("");

  const [
    nuevoNombreFestivo,
    setNuevoNombreFestivo,
  ] = useState("");

  const [
    cargandoFestivos,
    setCargandoFestivos,
  ] = useState(false);

  const [
    guardandoFestivos,
    setGuardandoFestivos,
  ] = useState(false);


  // ===================================================
  // ESTADOS GENERALES
  // ===================================================

  const [
    cargandoPagina,
    setCargandoPagina,
  ] = useState(true);

  const [
    procesandoArchivo,
    setProcesandoArchivo,
  ] = useState(false);

  const [
    guardando,
    setGuardando,
  ] = useState(false);

  const [
    cerrando,
    setCerrando,
  ] = useState(false);

  const [
    guardandoTecnico,
    setGuardandoTecnico,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  const [
    mensaje,
    setMensaje,
  ] = useState("");


  // ===================================================
  // MOTOR DE HORAS
  // ===================================================

  const resultado =
    useMemo(() => {

      if (!registros.length) {
        return null;
      }

      return procesarRegistros(
        registros
      );

    }, [registros]);


  // ===================================================
  // MOTOR DE ASISTENCIA + FESTIVOS
  // ===================================================

  const asistencia =
    useMemo(() => {

      if (!resultado) {
        return null;
      }

      return calcularAsistenciaNomina({
        tecnicosCatalogo,

        resultadoHoras:
          resultado,

        festivos:
          configuracionesFestivos,
      });

    }, [
      resultado,
      tecnicosCatalogo,
      configuracionesFestivos,
    ]);

// ===================================================
// RESUMEN SEMANAL
// ===================================================

const resumenSemanal =
  useMemo(() => {

    if (!asistencia) {
      return null;
    }

    return calcularResumenSemanalNomina(
      asistencia
    );

  }, [asistencia]);


  // ===================================================
  // FECHAS DEL PERIODO
  // ===================================================

  const fechasPeriodo =
    useMemo(() => {

      if (
        !resultado?.periodoInicio ||
        !resultado?.periodoFin
      ) {
        return [];
      }

      const inicio =
        crearFechaLocal(
          resultado.periodoInicio
        );

      const fin =
        crearFechaLocal(
          resultado.periodoFin
        );

      if (!inicio || !fin) {
        return [];
      }

      const fechas = [];

      const cursor =
        new Date(inicio);

      while (cursor <= fin) {

        fechas.push(
          fechaISO(cursor)
        );

        cursor.setDate(
          cursor.getDate() + 1
        );
      }

      return fechas;

    }, [resultado]);


  // ===================================================
  // PREPARAR EDICIÓN TÉCNICOS
  // ===================================================

  const prepararEdicionTecnicos = (
    tecnicos
  ) => {

    const nuevo = {};

    tecnicos.forEach(
      (tecnico) => {

        nuevo[tecnico.id] = {
          fechaAlta:
            tecnico.fechaAlta || "",

          fechaBaja:
            tecnico.fechaBaja || "",
        };
      }
    );

    setEdicionTecnicos(
      nuevo
    );
  };


  // ===================================================
  // CARGAR TÉCNICOS
  // ===================================================

  const cargarTecnicos =
    async () => {

      const lista =
        await obtenerTecnicosNomina();

      setTecnicosCatalogo(
        lista
      );

      prepararEdicionTecnicos(
        lista
      );

      return lista;
    };


  // ===================================================
  // CARGAR FESTIVOS DEL PERIODO
  // ===================================================

  const cargarFestivosDelPeriodo =
    async (
      periodoInicio,
      periodoFin
    ) => {

      if (
        !periodoInicio ||
        !periodoFin
      ) {
        setConfiguracionesFestivos(
          []
        );

        setAniosSinConfigurar(
          []
        );

        return;
      }


      const datos =
        await obtenerFestivosPeriodo(
          periodoInicio,
          periodoFin
        );


      setConfiguracionesFestivos(
        datos.configuraciones
      );

      setAniosSinConfigurar(
        datos.aniosSinConfigurar
      );
    };


  // ===================================================
  // CARGAR CONFIGURACIÓN DE UN AÑO
  // ===================================================

  const cargarConfiguracionFestivos =
    async (anio) => {

      setCargandoFestivos(true);

      setError("");


      try {

        const config =
          await obtenerFestivosAnio(
            anio
          );


        setFestivosEdicion(
          config.fechas || []
        );

        setFestivosConfigurados(
          config.configurado ===
            true
        );

      } catch (err) {

        console.error(err);

        setError(
          "No fue posible cargar la configuración de festivos."
        );

      } finally {

        setCargandoFestivos(
          false
        );
      }
    };


  // ===================================================
  // CARGA INICIAL
  // ===================================================

  useEffect(() => {

    const iniciar =
      async () => {

        try {

          const [
            datosNomina,
            listaTecnicos,
          ] = await Promise.all([

            obtenerNominaAbierta(),

            obtenerTecnicosNomina(),

          ]);


          setTecnicosCatalogo(
            listaTecnicos
          );

          prepararEdicionTecnicos(
            listaTecnicos
          );


          if (
            datosNomina
          ) {

            const datos =
              datosNomina;


            setNominaAbierta(
              datosNomina
            );


            setRegistros(
              Array.isArray(
                datos.registros
              )
                ? datos.registros
                : []
            );


            setNombreArchivo(
              datos.nombreArchivo ||
                ""
            );


            if (
              datos.periodoInicio &&
              datos.periodoFin
            ) {

              await cargarFestivosDelPeriodo(
                datos.periodoInicio,
                datos.periodoFin
              );


              setAnioFestivos(
                Number(
                  String(
                    datos.periodoInicio
                  ).substring(
                    0,
                    4
                  )
                )
              );
            }
          }

        } catch (err) {

          console.error(err);

          setError(
            "No fue posible cargar la información de Nómina."
          );

        } finally {

          setCargandoPagina(
            false
          );
        }
      };


    iniciar();

  }, []);


  // ===================================================
  // CUANDO ABRIMOS VISTA FESTIVOS
  // ===================================================

  useEffect(() => {

    if (
      vista === "festivos"
    ) {
      cargarConfiguracionFestivos(
        anioFestivos
      );
    }

  }, [
    vista,
    anioFestivos,
  ]);



  // ===================================================
  // CARGAR XLS
  // ===================================================

  const cargarArchivo =
    async (event) => {

      const archivo =
        event.target.files?.[0];

      if (!archivo) {
        return;
      }


      setError("");
      setMensaje("");

      setProcesandoArchivo(
        true
      );


      try {

        const contenido =
          await archivo.text();


        const datos =
          leerArchivoXLS(
            contenido
          );


        if (!datos.length) {

          throw new Error(
            "El archivo no contiene registros."
          );
        }


        const nuevoResultado =
          procesarRegistros(
            datos
          );


        if (
          !nuevoResultado
            .periodoInicio ||
          !nuevoResultado
            .periodoFin
        ) {

          throw new Error(
            "No se pudo determinar el rango del archivo."
          );
        }


        setGuardando(true);


        // =============================================
        // SINCRONIZAR TÉCNICOS
        // =============================================

        const catalogoActualizado =
          await sincronizarTecnicosDesdeXLS(
            nuevoResultado
          );


        setTecnicosCatalogo(
          catalogoActualizado
        );

        prepararEdicionTecnicos(
          catalogoActualizado
        );


        // =============================================
        // CARGAR FESTIVOS DEL NUEVO PERIODO
        // =============================================

        await cargarFestivosDelPeriodo(
          nuevoResultado.periodoInicio,
          nuevoResultado.periodoFin
        );


        setAnioFestivos(
          Number(
            String(
              nuevoResultado
                .periodoInicio
            ).substring(
              0,
              4
            )
          )
        );


        // =============================================
        // GUARDAR NÓMINA ABIERTA
        // =============================================

        const nominaGuardada =
          await guardarNominaAbiertaDB({
            registros: datos,
            nombreArchivo: archivo.name,
            resultado: nuevoResultado,
          });

        setNominaAbierta(
          nominaGuardada
        );


        setRegistros(
          datos
        );

        setNombreArchivo(
          archivo.name
        );


        setMensaje(
          nominaAbierta
            ? "✅ Nómina actualizada. Horas, asistencia, técnicos y festivos fueron recalculados."
            : "✅ Nómina abierta correctamente."
        );

      } catch (err) {

        console.error(err);

        setError(
          err?.message ||
            "No fue posible procesar el archivo."
        );

      } finally {

        setProcesandoArchivo(
          false
        );

        setGuardando(
          false
        );

        event.target.value = "";
      }
    };


  // ===================================================
  // EDICIÓN TÉCNICO
  // ===================================================

  const cambiarCampoTecnico = (
    id,
    campo,
    valor
  ) => {

    setEdicionTecnicos(
      (anterior) => ({
        ...anterior,

        [id]: {
          ...(anterior[id] ||
            {}),

          [campo]:
            valor,
        },
      })
    );
  };


  // ===================================================
  // GUARDAR TÉCNICO
  // ===================================================

  const guardarTecnico =
    async (tecnico) => {

      const edicion =
        edicionTecnicos[
          tecnico.id
        ] || {};


      setError("");
      setMensaje("");

      setGuardandoTecnico(
        tecnico.id
      );


      try {

        await guardarFechasTecnico({
          id:
            tecnico.id,

          fechaAlta:
            edicion.fechaAlta,

          fechaBaja:
            edicion.fechaBaja ||
            null,
        });


        await cargarTecnicos();


        setMensaje(
          `✅ Datos de ${tecnico.nombre} actualizados.`
        );

      } catch (err) {

        console.error(err);

        setError(
          err?.message ||
            "No fue posible actualizar el técnico."
        );

      } finally {

        setGuardandoTecnico(
          ""
        );
      }
    };


  // ===================================================
  // ACTIVAR / DESACTIVAR TÉCNICO
  // ===================================================

  const alternarEstadoTecnico =
    async (tecnico) => {

      const nuevoEstado =
        !tecnico.activo;


      let fechaBaja =
        edicionTecnicos[
          tecnico.id
        ]?.fechaBaja ||
        null;


      if (
        !nuevoEstado &&
        !fechaBaja
      ) {

        fechaBaja =
          obtenerHoyISO();
      }


      setError("");
      setMensaje("");

      setGuardandoTecnico(
        tecnico.id
      );


      try {

        await cambiarEstadoTecnico(
          tecnico.id,
          nuevoEstado,
          fechaBaja
        );


        await cargarTecnicos();


        setMensaje(
          nuevoEstado
            ? `✅ ${tecnico.nombre} fue reactivado.`
            : `✅ ${tecnico.nombre} fue marcado como inactivo.`
        );

      } catch (err) {

        console.error(err);

        setError(
          "No fue posible cambiar el estado del técnico."
        );

      } finally {

        setGuardandoTecnico(
          ""
        );
      }
    };


  // ===================================================
  // AGREGAR FESTIVO
  // ===================================================

  const agregarFestivo = () => {

    setError("");
    setMensaje("");


    if (!nuevaFechaFestivo) {

      setError(
        "Selecciona la fecha del festivo."
      );

      return;
    }


    if (!nuevoNombreFestivo.trim()) {

      setError(
        "Escribe el nombre del festivo."
      );

      return;
    }


    const anioFecha =
      Number(
        nuevaFechaFestivo.substring(
          0,
          4
        )
      );


    if (
      anioFecha !==
      Number(anioFestivos)
    ) {

      setError(
        `La fecha debe corresponder al año ${anioFestivos}.`
      );

      return;
    }


    const yaExiste =
      festivosEdicion.some(
        (festivo) =>
          festivo.fecha ===
          nuevaFechaFestivo
      );


    if (yaExiste) {

      setError(
        "Ya existe un festivo registrado en esa fecha."
      );

      return;
    }


    const nuevos = [
      ...festivosEdicion,

      {
        fecha:
          nuevaFechaFestivo,

        nombre:
          nuevoNombreFestivo.trim(),
      },
    ].sort(
      (a, b) =>
        a.fecha.localeCompare(
          b.fecha
        )
    );


    setFestivosEdicion(
      nuevos
    );


    setNuevaFechaFestivo(
      ""
    );

    setNuevoNombreFestivo(
      ""
    );
  };


  // ===================================================
  // ELIMINAR FESTIVO
  // ===================================================

  const eliminarFestivo = (
    fecha
  ) => {

    setFestivosEdicion(
      (actuales) =>
        actuales.filter(
          (festivo) =>
            festivo.fecha !==
            fecha
        )
    );
  };


  // ===================================================
  // GUARDAR FESTIVOS
  // ===================================================

  const guardarConfiguracionFestivos =
    async () => {

      setError("");
      setMensaje("");

      setGuardandoFestivos(
        true
      );


      try {

        const config =
          await guardarFestivosAnio({
            anio:
              Number(
                anioFestivos
              ),

            fechas:
              festivosEdicion,

            configurado:
              true,
          });


        setFestivosEdicion(
          config.fechas || []
        );

        setFestivosConfigurados(
          true
        );


        if (resultado) {

          await cargarFestivosDelPeriodo(
            resultado.periodoInicio,
            resultado.periodoFin
          );
        }


        setMensaje(
          `✅ Festivos ${anioFestivos} guardados y confirmados. La Nómina fue recalculada.`
        );

      } catch (err) {

        console.error(err);

        setError(
          err?.message ||
            "No fue posible guardar los festivos."
        );

      } finally {

        setGuardandoFestivos(
          false
        );
      }
    };


  // ===================================================
  // HISTORIAL
  // ===================================================

  const cargarHistorial =
    async () => {

      setCargandoHistorial(true);
      setError("");

      try {

        const lista =
          await obtenerHistorialNominas();

        setHistorialNominas(
          lista
        );

      } catch (err) {

        console.error(err);

        setError(
          err?.message ||
            "No fue posible cargar el historial de Nóminas."
        );

      } finally {

        setCargandoHistorial(false);
      }
    };


  const abrirNominaHistorica =
    async (id) => {

      setCargandoDetalleHistorial(true);
      setError("");

      try {

        const datos =
          await obtenerNominaHistorial(
            id
          );

        setNominaHistorica(
          datos
        );

      } catch (err) {

        console.error(err);

        setError(
          err?.message ||
            "No fue posible abrir la Nómina histórica."
        );

      } finally {

        setCargandoDetalleHistorial(false);
      }
    };


  useEffect(() => {

    if (vista === "historial") {
      cargarHistorial();
    }

  }, [vista]);


  // ===================================================
  // CERRAR NÓMINA
  // ===================================================

  const cerrarNomina =
    async () => {

      if (
        !resultado ||
        !nominaAbierta ||
        !asistencia
      ) {
        return;
      }


      // ===============================================
      // BLOQUEO POR FESTIVOS NO CONFIGURADOS
      // ===============================================

      if (
        aniosSinConfigurar.length > 0
      ) {

        setError(
          `No puedes cerrar la Nómina. Falta confirmar el catálogo de festivos de: ${aniosSinConfigurar.join(
            ", "
          )}.`
        );

        setVista(
          "festivos"
        );

        return;
      }


      const confirmar =
        window.confirm(
          "¿Deseas cerrar esta nómina?\n\n" +
          `Periodo: ${fechaVisual(
            resultado.periodoInicio
          )} al ${fechaVisual(
            resultado.periodoFin
          )}\n\n` +
          "Se guardará una copia final de horas, asistencia, resumen semanal y festivos."
        );


      if (!confirmar) {
        return;
      }


      setCerrando(true);

      setError("");
      setMensaje("");


      try {

        await cerrarNominaDB({
          resultado,
          asistencia,
          registros,
          nombreArchivo,
          configuracionesFestivos,
          resumenSemanal,
          nominaAbierta,
        });

        await cargarHistorial();

setRegistros([]);

        setNombreArchivo("");

        setNominaAbierta(
          null
        );

        setConfiguracionesFestivos(
          []
        );

        setAniosSinConfigurar(
          []
        );

        setVista(
          "nomina"
        );


        setMensaje(
          "🔒 Nómina cerrada correctamente."
        );

      } catch (err) {

        console.error(err);

        setError(
          err?.message ||
            "No fue posible cerrar la nómina."
        );

      } finally {

        setCerrando(
          false
        );
      }
    };


  // ===================================================
  // PDF NÓMINA HISTÓRICA
  // ===================================================

  const descargarPDFNominaHistorica = () => {

    if (!nominaHistorica) {
      return;
    }

    try {

      generarPDFNominaHistorica(
        nominaHistorica
      );

    } catch (err) {

      console.error(err);

      setError(
        err?.message ||
          "No fue posible generar el PDF de la Nómina."
      );
    }
  };


  // ===================================================
  // ESTILOS
  // ===================================================

  const estiloKPI = {
    ...theme.card,

    marginBottom: 0,

    padding: "20px",

    minWidth: "170px",

    flex: "1 1 170px",
  };


  const th = {
    padding: "13px",

    borderBottom:
      `1px solid ${theme.colors.border}`,

    textAlign: "center",

    background: "#F8FAFC",

    color:
      theme.colors.text,

    fontWeight: "800",

    whiteSpace: "nowrap",
  };


  const td = {
    padding: "12px",

    borderBottom:
      `1px solid ${theme.colors.border}`,

    textAlign: "center",

    color:
      theme.colors.text,

    whiteSpace: "nowrap",
  };


  const botonVista = (
    nombre
  ) => ({
    ...theme.button.primary,

    opacity:
      vista === nombre
        ? 1
        : 0.65,
  });


  // ===================================================
  // CARGANDO
  // ===================================================

  if (cargandoPagina) {

    return (
      <div
        style={
          theme.layout.page
        }
      >

        <h1 style={theme.title}>
          💰 Nómina
        </h1>

        <div style={theme.card}>
          Cargando Nómina...
        </div>

      </div>
    );
  }


  // ===================================================
  // RENDER
  // ===================================================

  return (

    <div
      style={
        theme.layout.page
      }
    >

      <h1 style={theme.title}>
        💰 Nómina
      </h1>


      {/* =================================================
          NAVEGACIÓN
      ================================================= */}

      <div
        style={{
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
          marginBottom: "20px",
        }}
      >

        <button
          style={
            botonVista(
              "nomina"
            )
          }

          onClick={() =>
            setVista(
              "nomina"
            )
          }
        >
          💰 Nómina
        </button>
        <button
          style={
            botonVista(
              "semanal"
            )
          }

          onClick={() =>
            setVista(
              "semanal"
            )
          }
        >
          📊 Resumen Semanal
        </button>


        <button
          style={
            botonVista(
              "historial"
            )
          }

          onClick={() => {
            setNominaHistorica(
              null
            );

            setVista(
              "historial"
            );
          }}
        >
          📚 Historial
        </button>


        <button
          style={
            botonVista(
              "tecnicos"
            )
          }

          onClick={() =>
            setVista(
              "tecnicos"
            )
          }
        >
          ⚙️ Técnicos
        </button>


        <button
          style={
            botonVista(
              "festivos"
            )
          }

          onClick={() =>
            setVista(
              "festivos"
            )
          }
        >
          📅 Festivos
        </button>

      </div>


      {/* =================================================
          MENSAJES
      ================================================= */}

      {error && (
        <div
          style={
            theme.message.error
          }
        >
          {error}
        </div>
      )}


      {mensaje && (
        <div
          style={
            theme.message.success
          }
        >
          {mensaje}
        </div>
      )}


      {/* =================================================
          FESTIVOS
      ================================================= */}

      {vista === "festivos" && (

        <>

          <div style={theme.card}>

            <div
              style={{
                display: "flex",

                justifyContent:
                  "space-between",

                alignItems:
                  "center",

                gap: "15px",

                flexWrap:
                  "wrap",
              }}
            >

              <div>

                <h2
                  style={{
                    margin: 0,
                  }}
                >
                  📅 Catálogo de Festivos
                </h2>


                <p
                  style={{
                    color:
                      theme.colors.textLight,

                    marginBottom: 0,
                  }}
                >
                  Configuración anual utilizada
                  para el cálculo de Nómina.
                </p>

              </div>


              <select
                value={
                  anioFestivos
                }

                onChange={(e) =>
                  setAnioFestivos(
                    Number(
                      e.target.value
                    )
                  )
                }

                style={{
                  ...theme.input,

                  width: "150px",

                  margin: 0,
                }}
              >

                {Array.from(
                  {
                    length: 7,
                  },
                  (_, index) =>
                    obtenerAnioActual() -
                    2 +
                    index
                ).map(
                  (anio) => (

                    <option
                      key={anio}
                      value={anio}
                    >
                      {anio}
                    </option>

                  )
                )}

              </select>

            </div>

          </div>


          {cargandoFestivos ? (

            <div style={theme.card}>
              Cargando festivos...
            </div>

          ) : (

            <>

              <div
                style={{
                  ...theme.card,

                  border:
                    festivosConfigurados
                      ? "1px solid #86EFAC"
                      : "1px solid #FCD34D",

                  background:
                    festivosConfigurados
                      ? "#F0FDF4"
                      : "#FFFBEB",
                }}
              >

                <strong>
                  {festivosConfigurados
                    ? `✅ ${anioFestivos} configurado`
                    : `⚠️ ${anioFestivos} pendiente de confirmar`}
                </strong>


                <div
                  style={{
                    marginTop: "6px",

                    color:
                      theme.colors.textLight,
                  }}
                >
                  Aunque el año no tenga días
                  adicionales, debes guardar la
                  configuración para confirmarlo.
                </div>

              </div>


              {/* =========================================
                  AGREGAR FESTIVO
              ========================================= */}

              <div style={theme.card}>

                <h3
                  style={{
                    marginTop: 0,
                  }}
                >
                  Agregar festivo
                </h3>


                <div
                  style={{
                    display: "grid",

                    gridTemplateColumns:
                      "180px minmax(240px,1fr) auto",

                    gap: "12px",

                    alignItems:
                      "end",
                  }}
                >

                  <div>

                    <label>
                      Fecha
                    </label>

                    <input
                      type="date"

                      value={
                        nuevaFechaFestivo
                      }

                      onChange={(e) =>
                        setNuevaFechaFestivo(
                          e.target.value
                        )
                      }

                      style={
                        theme.input
                      }
                    />

                  </div>


                  <div>

                    <label>
                      Nombre
                    </label>

                    <input
                      type="text"

                      placeholder="Ej. Día de la Independencia"

                      value={
                        nuevoNombreFestivo
                      }

                      onChange={(e) =>
                        setNuevoNombreFestivo(
                          e.target.value
                        )
                      }

                      style={
                        theme.input
                      }
                    />

                  </div>


                  <button
                    onClick={
                      agregarFestivo
                    }

                    style={
                      theme.button.primary
                    }
                  >
                    ➕ Agregar
                  </button>

                </div>

              </div>


              {/* =========================================
                  LISTA
              ========================================= */}

              <div style={theme.card}>

                <h3
                  style={{
                    marginTop: 0,
                  }}
                >
                  Festivos {anioFestivos}
                </h3>


                {!festivosEdicion.length ? (

                  <div
                    style={{
                      padding: "25px",

                      textAlign:
                        "center",

                      color:
                        theme.colors.textLight,
                    }}
                  >
                    No hay festivos agregados.
                  </div>

                ) : (

                  <div
                    style={{
                      overflowX:
                        "auto",
                    }}
                  >

                    <table
                      style={{
                        width:
                          "100%",

                        borderCollapse:
                          "collapse",
                      }}
                    >

                      <thead>

                        <tr>

                          <th style={th}>
                            Fecha
                          </th>

                          <th
                            style={{
                              ...th,
                              textAlign:
                                "left",
                            }}
                          >
                            Festivo
                          </th>

                          <th style={th}>
                            Acción
                          </th>

                        </tr>

                      </thead>


                      <tbody>

                        {festivosEdicion.map(
                          (festivo) => (

                            <tr
                              key={
                                festivo.fecha
                              }
                            >

                              <td style={td}>
                                {fechaVisual(
                                  festivo.fecha
                                )}
                              </td>


                              <td
                                style={{
                                  ...td,

                                  textAlign:
                                    "left",

                                  fontWeight:
                                    "800",
                                }}
                              >
                                {festivo.nombre}
                              </td>


                              <td style={td}>

                                <button
                                  onClick={() =>
                                    eliminarFestivo(
                                      festivo.fecha
                                    )
                                  }

                                  style={
                                    theme.button.danger
                                  }
                                >
                                  🗑️ Eliminar
                                </button>

                              </td>

                            </tr>

                          )
                        )}

                      </tbody>

                    </table>

                  </div>
                )}


                <div
                  style={{
                    display:
                      "flex",

                    justifyContent:
                      "flex-end",

                    marginTop:
                      "20px",
                  }}
                >

                  <button
                    onClick={
                      guardarConfiguracionFestivos
                    }

                    disabled={
                      guardandoFestivos
                    }

                    style={
                      theme.button.primary
                    }
                  >
                    {guardandoFestivos
                      ? "Guardando..."
                      : "💾 Guardar y confirmar año"}
                  </button>

                </div>

              </div>

            </>
          )}

        </>
      )}

{/* =================================================
    RESUMEN SEMANAL
================================================= */}

{vista === "semanal" && (

  <>

    {!resultado ||
    !asistencia ||
    !resumenSemanal ? (

      <div
        style={{
          ...theme.card,

          textAlign:
            "center",

          padding:
            "50px 24px",
        }}
      >

        <div
          style={{
            fontSize:
              "48px",
          }}
        >
          📊
        </div>

        <h2>
          No hay una nómina abierta
        </h2>

        <p
          style={{
            color:
              theme.colors.textLight,
          }}
        >
          Carga un XLS para generar
          el resumen semanal.
        </p>

      </div>

    ) : (

      <>

        {/* =========================================
            ENCABEZADO
        ========================================= */}

        <div style={theme.card}>

          <div
            style={{
              display:
                "flex",

              justifyContent:
                "space-between",

              alignItems:
                "center",

              gap:
                "20px",

              flexWrap:
                "wrap",
            }}
          >

            <div>

              <h2
                style={{
                  margin: 0,
                }}
              >
                📊 Resumen Semanal
              </h2>

              <p
                style={{
                  color:
                    theme.colors.textLight,

                  marginBottom: 0,

                  marginTop:
                    "8px",
                }}
              >
                Periodo cargado:{" "}

                <strong>
                  {fechaVisual(
                    resultado.periodoInicio
                  )}
                </strong>

                {" al "}

                <strong>
                  {fechaVisual(
                    resultado.periodoFin
                  )}
                </strong>
              </p>

            </div>


            <div
              style={{
                padding:
                  "10px 16px",

                borderRadius:
                  "14px",

                background:
                  "#EFF6FF",

                color:
                  "#1D4ED8",

                fontWeight:
                  "900",
              }}
            >
              {
                resumenSemanal
                  .semanas.length
              }{" "}
              {
                resumenSemanal
                  .semanas.length === 1
                  ? "semana"
                  : "semanas"
              }
            </div>

          </div>

        </div>


        {/* =========================================
            SEMANAS
        ========================================= */}

        {resumenSemanal
          .semanas
          .map(
            (semana) => {

              const esParcial =
                semana.parcialInicio ||
                semana.parcialFin;


              return (

                <div
                  key={
                    semana.numero
                  }

                  style={
                    theme.card
                  }
                >

                  {/* =================================
                      ENCABEZADO SEMANA
                  ================================= */}

                  <div
                    style={{
                      display:
                        "flex",

                      justifyContent:
                        "space-between",

                      alignItems:
                        "flex-start",

                      gap:
                        "20px",

                      flexWrap:
                        "wrap",

                      marginBottom:
                        "20px",
                    }}
                  >

                    <div>

                      <h2
                        style={{
                          margin:
                            "0 0 6px 0",
                        }}
                      >
                        Semana{" "}
                        {
                          semana.numero
                        }

                        {" · "}

                        {fechaVisual(
                          semana.lunes
                        )}

                        {" al "}

                        {fechaVisual(
                          semana.domingo
                        )}
                      </h2>


                      <div
                        style={{
                          color:
                            theme.colors.textLight,

                          fontWeight:
                            "700",
                        }}
                      >
                        Periodo evaluado:{" "}

                        {fechaVisual(
                          semana.inicioEvaluado
                        )}

                        {" al "}

                        {fechaVisual(
                          semana.finEvaluado
                        )}
                      </div>

                    </div>


                    <span
                      style={{
                        padding:
                          "8px 14px",

                        borderRadius:
                          "14px",

                        fontWeight:
                          "900",

                        background:
                          esParcial
                            ? "#FEF3C7"
                            : "#DCFCE7",

                        color:
                          esParcial
                            ? "#92400E"
                            : "#166534",
                      }}
                    >
                      {esParcial
                        ? "⚠️ Semana parcial"
                        : "✅ Semana completa"}
                    </span>

                  </div>


                  {/* =================================
                      TABLA
                  ================================= */}

                  <div
                    style={{
                      overflowX:
                        "auto",
                    }}
                  >

                    <table
                      style={{
                        width:
                          "100%",

                        borderCollapse:
                          "collapse",

                        minWidth:
                          "1300px",
                      }}
                    >

                      <thead>

                        <tr>

                          <th
                            style={{
                              ...th,

                              textAlign:
                                "left",
                            }}
                          >
                            Técnico
                          </th>

                          <th style={th}>
                            Reportadas
                          </th>

                          <th style={th}>
                            Contabilizadas
                          </th>

                          <th style={th}>
                            Faltas
                          </th>

                          <th style={th}>
                            Días trabajados
                          </th>

                          <th style={th}>
                            Sábados
                          </th>

                          <th style={th}>
                            Domingos
                          </th>

                          <th style={th}>
                            Horas domingo
                          </th>

                          <th style={th}>
                            Festivos
                          </th>

                          <th style={th}>
                            Horas festivas
                          </th>

                          <th style={th}>
                            Alertas
                          </th>

                        </tr>

                      </thead>


                      <tbody>

                        {resumenSemanal
                          .tecnicos
                          .map(
                            (
                              tecnico
                            ) => {

                              const datosSemana =
                                tecnico
                                  .semanas
                                  .find(
                                    (
                                      item
                                    ) =>
                                      item.numeroSemana ===
                                      semana.numero
                                  );


                              if (
                                !datosSemana
                              ) {
                                return null;
                              }


                              return (

                                <tr
                                  key={
                                    `${semana.numero}_${tecnico.nombre}`
                                  }
                                >

                                  <td
                                    style={{
                                      ...td,

                                      textAlign:
                                        "left",

                                      fontWeight:
                                        "800",
                                    }}
                                  >
                                    {
                                      tecnico.nombre
                                    }
                                  </td>


                                  <td
                                    style={
                                      td
                                    }
                                  >
                                    {segundosAHoras(
                                      datosSemana
                                        .segundosReportados
                                    )}
                                  </td>


                                  <td
                                    style={{
                                      ...td,

                                      color:
                                        theme.colors.primary,

                                      fontWeight:
                                        "900",
                                    }}
                                  >
                                    {segundosAHoras(
                                      datosSemana
                                        .segundosContabilizados
                                    )}
                                  </td>


                                  <td
                                    style={{
                                      ...td,

                                      fontWeight:
                                        "900",

                                      color:
                                        datosSemana
                                          .faltas >
                                        0
                                          ? theme.colors.error
                                          : theme.colors.success,
                                    }}
                                  >
                                    {
                                      datosSemana.faltas
                                    }
                                  </td>


                                  <td
                                    style={
                                      td
                                    }
                                  >
                                    {
                                      datosSemana
                                        .diasTrabajados
                                    }
                                  </td>


                                  <td
                                    style={
                                      td
                                    }
                                  >
                                    {
                                      datosSemana
                                        .sabadosTrabajados
                                    }
                                  </td>


                                  <td
                                    style={
                                      td
                                    }
                                  >
                                    {
                                      datosSemana
                                        .domingosTrabajados
                                    }
                                  </td>


                                  <td
                                    style={
                                      td
                                    }
                                  >
                                    {segundosAHoras(
                                      datosSemana
                                        .segundosDomingo
                                    )}
                                  </td>


                                  <td
                                    style={{
                                      ...td,

                                      fontWeight:
                                        "900",
                                    }}
                                  >
                                    {
                                      datosSemana
                                        .festivosTrabajados
                                    }
                                  </td>


                                  <td
                                    style={
                                      td
                                    }
                                  >
                                    {segundosAHoras(
                                      datosSemana
                                        .segundosFestivo
                                    )}
                                  </td>


                                  <td
                                    style={
                                      td
                                    }
                                  >

                                    {datosSemana
                                      .diasPeriodoAlto >
                                    0 ? (

                                      <span
                                        style={{
                                          padding:
                                            "5px 9px",

                                          borderRadius:
                                            "10px",

                                          background:
                                            "#FEF3C7",

                                          color:
                                            "#92400E",

                                          fontWeight:
                                            "900",
                                        }}
                                      >
                                        ⚠️{" "}
                                        {
                                          datosSemana
                                            .diasPeriodoAlto
                                        }{" "}
                                        {
                                          datosSemana
                                            .diasPeriodoAlto ===
                                          1
                                            ? "día"
                                            : "días"
                                        }
                                      </span>

                                    ) : (

                                      <span
                                        style={{
                                          color:
                                            theme.colors.success,

                                          fontWeight:
                                            "900",
                                        }}
                                      >
                                        ✓
                                      </span>

                                    )}

                                  </td>

                                </tr>
                              );
                            }
                          )}

                      </tbody>

                    </table>

                  </div>

                </div>
              );
            }
          )}

      </>
    )}

  </>
)}

      {/* =================================================
          HISTORIAL
      ================================================= */}

      {vista === "historial" && (

        <>

          {!nominaHistorica ? (

            <div style={theme.card}>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "15px",
                  flexWrap: "wrap",
                  marginBottom: "18px",
                }}
              >

                <div>

                  <h2
                    style={{
                      margin: 0,
                    }}
                  >
                    📚 Historial de Nóminas
                  </h2>

                  <p
                    style={{
                      color: theme.colors.textLight,
                      marginBottom: 0,
                    }}
                  >
                    Las Nóminas cerradas son snapshots históricos y no se recalculan.
                  </p>

                </div>

                <button
                  onClick={
                    cargarHistorial
                  }
                  disabled={
                    cargandoHistorial
                  }
                  style={
                    theme.button.primary
                  }
                >
                  {cargandoHistorial
                    ? "Actualizando..."
                    : "🔄 Actualizar"}
                </button>

              </div>


              {cargandoHistorial ? (

                <div
                  style={{
                    padding: "35px",
                    textAlign: "center",
                  }}
                >
                  Cargando historial...
                </div>

              ) : !historialNominas.length ? (

                <div
                  style={{
                    padding: "35px",
                    textAlign: "center",
                    color: theme.colors.textLight,
                  }}
                >
                  Aún no hay Nóminas cerradas.
                </div>

              ) : (

                <div
                  style={{
                    overflowX: "auto",
                  }}
                >

                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      minWidth: "1100px",
                    }}
                  >

                    <thead>
                      <tr>
                        <th style={th}>Periodo</th>
                        <th style={th}>Técnicos</th>
                        <th style={th}>Registros</th>
                        <th style={th}>Faltas</th>
                        <th style={th}>Domingos</th>
                        <th style={th}>Festivos</th>
                        <th style={th}>Archivo</th>
                        <th style={th}>Fecha cierre</th>
                        <th style={th}>Acción</th>
                      </tr>
                    </thead>

                    <tbody>

                      {historialNominas.map(
                        (nomina) => (

                          <tr key={nomina.id}>

                            <td style={td}>
                              <strong>
                                {fechaVisual(
                                  nomina.periodoInicio
                                )}
                              </strong>
                              {" al "}
                              <strong>
                                {fechaVisual(
                                  nomina.periodoFin
                                )}
                              </strong>
                            </td>

                            <td style={td}>
                              {nomina.cantidadTecnicos ?? 0}
                            </td>

                            <td style={td}>
                              {nomina.cantidadRegistros ?? 0}
                            </td>

                            <td style={td}>
                              {nomina.totalesAsistencia?.faltas ?? 0}
                            </td>

                            <td style={td}>
                              {nomina.totalesAsistencia?.domingosTrabajados ?? 0}
                            </td>

                            <td style={td}>
                              {nomina.totalesAsistencia?.festivosTrabajados ?? 0}
                            </td>

                            <td
                              style={{
                                ...td,
                                maxWidth: "220px",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                              title={
                                nomina.nombreArchivo || ""
                              }
                            >
                              {nomina.nombreArchivo || "-"}
                            </td>

                            <td style={td}>
                              {timestampATexto(
                                nomina.fechaCierre
                              )}
                            </td>

                            <td style={td}>
                              <button
                                onClick={() =>
                                  abrirNominaHistorica(
                                    nomina.id
                                  )
                                }
                                style={
                                  theme.button.primary
                                }
                              >
                                👁️ Ver detalle
                              </button>
                            </td>

                          </tr>
                        )
                      )}

                    </tbody>

                  </table>

                </div>
              )}

            </div>

          ) : (

            <>

              <div style={theme.card}>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "15px",
                    flexWrap: "wrap",
                  }}
                >

                  <div>

                    <div
                      style={{
                        color: theme.colors.textLight,
                        fontWeight: "800",
                      }}
                    >
                      🔒 NÓMINA CERRADA
                    </div>

                    <h2
                      style={{
                        margin: "6px 0 0 0",
                      }}
                    >
                      {fechaVisual(
                        nominaHistorica.periodoInicio
                      )}
                      {" — "}
                      {fechaVisual(
                        nominaHistorica.periodoFin
                      )}
                    </h2>

                    <div
                      style={{
                        marginTop: "8px",
                        color: theme.colors.textLight,
                      }}
                    >
                      Cerrada:{" "}
                      <strong>
                        {timestampATexto(
                          nominaHistorica.fechaCierre
                        )}
                      </strong>
                      {" · "}
                      Archivo:{" "}
                      <strong>
                        {nominaHistorica.nombreArchivo || "-"}
                      </strong>
                    </div>

                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      flexWrap: "wrap",
                    }}
                  >

                    <button
                      onClick={
                        descargarPDFNominaHistorica
                      }
                      style={
                        theme.button.primary
                      }
                    >
                      📄 Generar PDF
                    </button>

                    <button
                      onClick={() =>
                        setNominaHistorica(
                          null
                        )
                      }
                      style={
                        theme.button.primary
                      }
                    >
                      ← Volver al historial
                    </button>

                  </div>

                </div>

              </div>


              {cargandoDetalleHistorial ? (

                <div style={theme.card}>
                  Cargando detalle...
                </div>

              ) : (

                <div style={theme.card}>

                  <h3
                    style={{
                      marginTop: 0,
                    }}
                  >
                    Resumen final por técnico
                  </h3>

                  <div
                    style={{
                      overflowX: "auto",
                    }}
                  >

                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        minWidth: "1250px",
                      }}
                    >

                      <thead>
                        <tr>
                          <th
                            style={{
                              ...th,
                              textAlign: "left",
                            }}
                          >
                            Técnico
                          </th>
                          <th style={th}>Reportadas</th>
                          <th style={th}>Contabilizadas</th>
                          <th style={th}>Faltas</th>
                          <th style={th}>Días trabajados</th>
                          <th style={th}>Sábados</th>
                          <th style={th}>Domingos</th>
                          <th style={th}>Horas domingo</th>
                          <th style={th}>Festivos</th>
                          <th style={th}>Horas festivas</th>
                          <th style={th}>Alertas</th>
                        </tr>
                      </thead>

                      <tbody>

                        {(nominaHistorica.resumenTecnicos || []).map(
                          (tecnico, index) => (

                            <tr
                              key={
                                `${tecnico.id || tecnico.nombre}_${index}`
                              }
                            >

                              <td
                                style={{
                                  ...td,
                                  textAlign: "left",
                                  fontWeight: "800",
                                }}
                              >
                                {tecnico.nombre}
                              </td>

                              <td style={td}>
                                {segundosAHoras(
                                  tecnico.segundosReportadosTotal || 0
                                )}
                              </td>

                              <td
                                style={{
                                  ...td,
                                  color: theme.colors.primary,
                                  fontWeight: "900",
                                }}
                              >
                                {segundosAHoras(
                                  tecnico.segundosContabilizadosTotal || 0
                                )}
                              </td>

                              <td style={td}>
                                {tecnico.faltas ?? 0}
                              </td>

                              <td style={td}>
                                {tecnico.diasTrabajados ?? 0}
                              </td>

                              <td style={td}>
                                {tecnico.sabadosTrabajados ?? 0}
                              </td>

                              <td style={td}>
                                {tecnico.domingosTrabajados ?? 0}
                              </td>

                              <td style={td}>
                                {segundosAHoras(
                                  tecnico.segundosDomingo || 0
                                )}
                              </td>

                              <td style={td}>
                                {tecnico.festivosTrabajados ?? 0}
                              </td>

                              <td style={td}>
                                {segundosAHoras(
                                  tecnico.segundosFestivo || 0
                                )}
                              </td>

                              <td style={td}>
                                {(tecnico.diasPeriodoAlto || 0) > 0
                                  ? `⚠️ ${tecnico.diasPeriodoAlto}`
                                  : "✓"}
                              </td>

                            </tr>
                          )
                        )}

                      </tbody>

                    </table>

                  </div>

                </div>
              )}

            </>
          )}

        </>
      )}


      {/* =================================================
          TÉCNICOS
      ================================================= */}

      {vista === "tecnicos" && (

        <div style={theme.card}>

          <h2
            style={{
              marginTop: 0,
            }}
          >
            ⚙️ Catálogo de Técnicos
          </h2>


          <p
            style={{
              color:
                theme.colors.textLight,
            }}
          >
            Los técnicos nuevos se agregan
            automáticamente al cargar un XLS.
            Los inactivos no se reactivan
            automáticamente.
          </p>


          {!tecnicosCatalogo.length ? (

            <div
              style={{
                padding: "30px",

                textAlign:
                  "center",
              }}
            >
              No hay técnicos registrados.
            </div>

          ) : (

            <div
              style={{
                overflowX:
                  "auto",
              }}
            >

              <table
                style={{
                  width:
                    "100%",

                  borderCollapse:
                    "collapse",

                  minWidth:
                    "850px",
                }}
              >

                <thead>

                  <tr>

                    <th
                      style={{
                        ...th,

                        textAlign:
                          "left",
                      }}
                    >
                      Técnico
                    </th>

                    <th style={th}>
                      Estado
                    </th>

                    <th style={th}>
                      Fecha alta
                    </th>

                    <th style={th}>
                      Fecha baja
                    </th>

                    <th style={th}>
                      Acciones
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {tecnicosCatalogo.map(
                    (tecnico) => {

                      const edit =
                        edicionTecnicos[
                          tecnico.id
                        ] || {};

                      const ocupado =
                        guardandoTecnico ===
                        tecnico.id;


                      return (

                        <tr
                          key={
                            tecnico.id
                          }
                        >

                          <td
                            style={{
                              ...td,

                              textAlign:
                                "left",

                              fontWeight:
                                "800",
                            }}
                          >
                            {tecnico.nombre}
                          </td>


                          <td style={td}>

                            <span
                              style={{
                                padding:
                                  "6px 10px",

                                borderRadius:
                                  "12px",

                                fontWeight:
                                  "800",

                                background:
                                  tecnico.activo
                                    ? "#DCFCE7"
                                    : "#FEE2E2",

                                color:
                                  tecnico.activo
                                    ? "#166534"
                                    : "#991B1B",
                              }}
                            >
                              {tecnico.activo
                                ? "Activo"
                                : "Inactivo"}
                            </span>

                          </td>


                          <td style={td}>

                            <input
                              type="date"

                              value={
                                edit.fechaAlta ||
                                ""
                              }

                              onChange={(e) =>
                                cambiarCampoTecnico(
                                  tecnico.id,
                                  "fechaAlta",
                                  e.target.value
                                )
                              }

                              style={{
                                ...theme.input,
                                margin: 0,
                              }}
                            />

                          </td>


                          <td style={td}>

                            <input
                              type="date"

                              value={
                                edit.fechaBaja ||
                                ""
                              }

                              onChange={(e) =>
                                cambiarCampoTecnico(
                                  tecnico.id,
                                  "fechaBaja",
                                  e.target.value
                                )
                              }

                              style={{
                                ...theme.input,
                                margin: 0,
                              }}
                            />

                          </td>


                          <td style={td}>

                            <div
                              style={{
                                display:
                                  "flex",

                                gap:
                                  "8px",

                                justifyContent:
                                  "center",

                                flexWrap:
                                  "wrap",
                              }}
                            >

                              <button
                                disabled={
                                  ocupado
                                }

                                onClick={() =>
                                  guardarTecnico(
                                    tecnico
                                  )
                                }

                                style={
                                  theme.button.primary
                                }
                              >
                                💾 Guardar
                              </button>


                              <button
                                disabled={
                                  ocupado
                                }

                                onClick={() =>
                                  alternarEstadoTecnico(
                                    tecnico
                                  )
                                }

                                style={
                                  tecnico.activo
                                    ? theme.button.danger
                                    : theme.button.primary
                                }
                              >
                                {tecnico.activo
                                  ? "⛔ Desactivar"
                                  : "✅ Activar"}
                              </button>

                            </div>

                          </td>

                        </tr>
                      );
                    }
                  )}

                </tbody>

              </table>

            </div>
          )}

        </div>
      )}




      {/* =================================================
          NÓMINA
      ================================================= */}

      {vista === "nomina" && (

        <>

          {/* =============================================
              NÓMINA ABIERTA
          ============================================= */}

          {resultado &&
            nominaAbierta && (

              <div
                style={{
                  ...theme.card,

                  border:
                    "1px solid #86EFAC",

                  background:
                    "#F0FDF4",
                }}
              >

                <div
                  style={{
                    display:
                      "flex",

                    justifyContent:
                      "space-between",

                    alignItems:
                      "center",

                    flexWrap:
                      "wrap",

                    gap:
                      "20px",
                  }}
                >

                  <div>

                    <div
                      style={{
                        color:
                          "#166534",

                        fontWeight:
                          "900",
                      }}
                    >
                      🟢 NÓMINA ABIERTA
                    </div>


                    <div
                      style={{
                        fontSize:
                          "24px",

                        fontWeight:
                          "900",

                        marginTop:
                          "6px",
                      }}
                    >

                      {fechaVisual(
                        resultado.periodoInicio
                      )}

                      {" — "}

                      {fechaVisual(
                        resultado.periodoFin
                      )}

                    </div>


                    <div
                      style={{
                        marginTop:
                          "8px",

                        color:
                          theme.colors.textLight,

                        fontWeight:
                          "700",
                      }}
                    >
                      Última carga:{" "}

                      {fechaHoraVisual(
                        nominaAbierta
                          .fechaUltimaCarga
                      )}
                    </div>

                  </div>


                  <button
                    onClick={
                      cerrarNomina
                    }

                    disabled={
                      cerrando ||
                      aniosSinConfigurar.length >
                        0
                    }

                    style={{
                      ...theme.button.danger,

                      opacity:
                        aniosSinConfigurar.length >
                          0
                          ? 0.5
                          : 1,
                    }}
                  >
                    {cerrando
                      ? "Cerrando..."
                      : "🔒 Cerrar Nómina"}
                  </button>

                </div>

              </div>
            )}


          {/* =============================================
              ALERTA FESTIVOS
          ============================================= */}

          {resultado &&
            aniosSinConfigurar.length >
              0 && (

              <div
                style={
                  theme.message.warning
                }
              >

                ⚠️ Falta configurar y confirmar
                el catálogo de festivos de{" "}

                <strong>
                  {aniosSinConfigurar.join(
                    ", "
                  )}
                </strong>.

                {" "}Puedes continuar revisando
                la Nómina, pero no cerrarla.


                <button
                  onClick={() => {

                    setAnioFestivos(
                      aniosSinConfigurar[0]
                    );

                    setVista(
                      "festivos"
                    );
                  }}

                  style={{
                    ...theme.button.primary,

                    marginLeft:
                      "15px",
                  }}
                >
                  📅 Configurar Festivos
                </button>

              </div>
            )}


          {/* =============================================
              CARGAR XLS
          ============================================= */}

          <div style={theme.card}>

            <h2
              style={{
                marginTop: 0,
              }}
            >
              {resultado
                ? "Actualizar nómina"
                : "Iniciar nueva nómina"}
            </h2>


            <p
              style={{
                color:
                  theme.colors.textLight,

                lineHeight:
                  "1.6",
              }}
            >
              {resultado
                ? "Carga el XLS más reciente. La nueva carga reemplaza la captura anterior para evitar duplicados."
                : "Carga el primer XLS para comenzar el periodo."}
            </p>


            <input
              type="file"

              accept=".xls,.html,.htm"

              onChange={
                cargarArchivo
              }

              disabled={
                procesandoArchivo ||
                guardando ||
                cerrando
              }

              style={{
                ...theme.input,

                cursor:
                  "pointer",
              }}
            />


            {procesandoArchivo && (

              <div
                style={
                  theme.message.warning
                }
              >
                Procesando archivo,
                técnicos, asistencia y
                festivos...
              </div>
            )}


            {nombreArchivo &&
              resultado && (

                <div
                  style={{
                    marginTop:
                      "10px",

                    color:
                      theme.colors.textLight,

                    fontWeight:
                      "700",
                  }}
                >
                  Archivo actual:{" "}

                  <strong>
                    {nombreArchivo}
                  </strong>
                </div>
              )}

          </div>


          {/* =============================================
              SIN NÓMINA
          ============================================= */}

          {!resultado && (

            <div
              style={{
                ...theme.card,

                textAlign:
                  "center",

                padding:
                  "50px 24px",
              }}
            >

              <div
                style={{
                  fontSize:
                    "48px",
                }}
              >
                📂
              </div>

              <h2>
                No hay una nómina abierta
              </h2>

              <p
                style={{
                  color:
                    theme.colors.textLight,
                }}
              >
                Carga un XLS para comenzar.
              </p>

            </div>
          )}


          {/* =============================================
              RESULTADOS
          ============================================= */}

          {resultado &&
            asistencia && (

              <>

                {/* =========================================
                    KPIs
                ========================================= */}

                <div
                  style={{
                    display:
                      "flex",

                    flexWrap:
                      "wrap",

                    gap:
                      "16px",

                    marginBottom:
                      "24px",
                  }}
                >

                  <div style={estiloKPI}>

                    <div>
                      Técnicos
                    </div>

                    <strong
                      style={{
                        fontSize:
                          "28px",
                      }}
                    >
                      {asistencia
                        .tecnicos.length}
                    </strong>

                  </div>


                  <div style={estiloKPI}>

                    <div>
                      Faltas
                    </div>

                    <strong
                      style={{
                        fontSize:
                          "28px",

                        color:
                          asistencia
                            .totales
                            .faltas > 0
                            ? theme.colors.error
                            : theme.colors.success,
                      }}
                    >
                      {asistencia
                        .totales
                        .faltas}
                    </strong>

                  </div>


                  <div style={estiloKPI}>

                    <div>
                      Domingos
                    </div>

                    <strong
                      style={{
                        fontSize:
                          "28px",
                      }}
                    >
                      {asistencia
                        .totales
                        .domingosTrabajados}
                    </strong>

                  </div>


                  <div style={estiloKPI}>

                    <div>
                      Festivos trabajados
                    </div>

                    <strong
                      style={{
                        fontSize:
                          "28px",

                        color:
                          theme.colors.warning,
                      }}
                    >
                      {asistencia
                        .totales
                        .festivosTrabajados}
                    </strong>

                  </div>

                </div>


                {/* =========================================
                    RESUMEN
                ========================================= */}

                <div style={theme.card}>

                  <h2
                    style={{
                      marginTop: 0,
                    }}
                  >
                    Resumen de Nómina
                  </h2>


                  <div
                    style={{
                      overflowX:
                        "auto",
                    }}
                  >

                    <table
                      style={{
                        width:
                          "100%",

                        borderCollapse:
                          "collapse",

                        minWidth:
                          "1350px",
                      }}
                    >

                      <thead>

                        <tr>

                          <th
                            style={{
                              ...th,

                              textAlign:
                                "left",
                            }}
                          >
                            Técnico
                          </th>

                          <th style={th}>
                            Reportadas
                          </th>

                          <th style={th}>
                            Contabilizadas
                          </th>

                          <th style={th}>
                            Faltas
                          </th>

                          <th style={th}>
                            Sábados
                          </th>

                          <th style={th}>
                            Domingos
                          </th>

                          <th style={th}>
                            Horas domingo
                          </th>

                          <th style={th}>
                            Festivos
                          </th>

                          <th style={th}>
                            Horas festivas
                          </th>

                          <th style={th}>
                            Alertas
                          </th>

                        </tr>

                      </thead>


                      <tbody>

                        {asistencia
                          .tecnicos
                          .map(
                            (tecnico) => (

                              <tr
                                key={
                                  tecnico.nombre
                                }
                              >

                                <td
                                  style={{
                                    ...td,

                                    textAlign:
                                      "left",

                                    fontWeight:
                                      "800",
                                  }}
                                >
                                  {tecnico.nombre}
                                </td>


                                <td style={td}>
                                  {segundosAHoras(
                                    tecnico
                                      .segundosReportadosTotal
                                  )}
                                </td>


                                <td
                                  style={{
                                    ...td,

                                    color:
                                      theme.colors.primary,

                                    fontWeight:
                                      "900",
                                  }}
                                >
                                  {segundosAHoras(
                                    tecnico
                                      .segundosContabilizadosTotal
                                  )}
                                </td>


                                <td
                                  style={{
                                    ...td,

                                    color:
                                      tecnico.faltas >
                                      0
                                        ? theme.colors.error
                                        : theme.colors.success,

                                    fontWeight:
                                      "900",
                                  }}
                                >
                                  {tecnico.faltas}
                                </td>


                                <td style={td}>
                                  {tecnico
                                    .guardiasSabado}
                                </td>


                                <td style={td}>
                                  {tecnico
                                    .domingosTrabajados}
                                </td>


                                <td style={td}>
                                  {segundosAHoras(
                                    tecnico
                                      .segundosDomingo
                                  )}
                                </td>


                                <td
                                  style={{
                                    ...td,

                                    fontWeight:
                                      "900",
                                  }}
                                >
                                  {tecnico
                                    .festivosTrabajados}
                                </td>


                                <td style={td}>
                                  {segundosAHoras(
                                    tecnico
                                      .segundosFestivo
                                  )}
                                </td>


                                <td style={td}>
                                  {tecnico
                                    .diasPeriodoAlto >
                                  0
                                    ? `⚠️ ${tecnico.diasPeriodoAlto}`
                                    : "✓"}
                                </td>

                              </tr>
                            )
                          )}

                      </tbody>

                    </table>

                  </div>

                </div>


                {/* =========================================
                    MATRIZ DIARIA
                ========================================= */}

                <div style={theme.card}>

                  <h2
                    style={{
                      marginTop: 0,
                    }}
                  >
                    Detalle diario de asistencia
                  </h2>


                  <div
                    style={{
                      display:
                        "flex",

                      gap:
                        "14px",

                      flexWrap:
                        "wrap",

                      color:
                        theme.colors.textLight,

                      marginBottom:
                        "18px",

                      fontSize:
                        "13px",

                      fontWeight:
                        "700",
                    }}
                  >

                    <span>
                      ✅ Trabajado
                    </span>

                    <span>
                      ❌ Falta
                    </span>

                    <span>
                      🛡️ Fin de semana
                    </span>

                    <span>
                      🟠 Domingo
                    </span>

                    <span>
                      🎉 Festivo
                    </span>

                    <span>
                      ⚪ Fuera de plantilla
                    </span>

                  </div>


                  <div
                    style={{
                      overflowX:
                        "auto",
                    }}
                  >

                    <table
                      style={{
                        width:
                          "100%",

                        borderCollapse:
                          "collapse",

                        minWidth:
                          `${Math.max(
                            900,
                            260 +
                              fechasPeriodo.length *
                                155
                          )}px`,
                      }}
                    >

                      <thead>

                        <tr>

                          <th
                            style={{
                              ...th,

                              position:
                                "sticky",

                              left: 0,

                              zIndex: 3,

                              textAlign:
                                "left",
                            }}
                          >
                            Técnico
                          </th>


                          {fechasPeriodo.map(
                            (fecha) => (

                              <th
                                key={
                                  fecha
                                }

                                style={th}
                              >

                                <div>
                                  {nombreDia(
                                    fecha
                                  )}
                                </div>

                                <small>
                                  {fechaVisual(
                                    fecha
                                  )}
                                </small>

                              </th>
                            )
                          )}

                        </tr>

                      </thead>


                      <tbody>

                        {asistencia
                          .tecnicos
                          .map(
                            (tecnico) => (

                              <tr
                                key={
                                  tecnico.nombre
                                }
                              >

                                <td
                                  style={{
                                    ...td,

                                    position:
                                      "sticky",

                                    left: 0,

                                    zIndex: 2,

                                    background:
                                      theme.colors.card,

                                    textAlign:
                                      "left",

                                    fontWeight:
                                      "800",
                                  }}
                                >
                                  {tecnico.nombre}
                                </td>


                                {fechasPeriodo.map(
                                  (fecha) => {

                                    const dia =
                                      tecnico
                                        .dias[
                                          fecha
                                        ];


                                    if (!dia) {

                                      return (
                                        <td
                                          key={
                                            fecha
                                          }

                                          style={
                                            td
                                          }
                                        >
                                          —
                                        </td>
                                      );
                                    }


                                    let fondo =
                                      "transparent";

                                    let contenido =
                                      "—";

                                    let detalle =
                                      "";


                                    if (
                                      dia.estado ===
                                      "FUERA_PERIODO_LABORAL"
                                    ) {

                                      fondo =
                                        "#F1F5F9";

                                      contenido =
                                        "⚪";
                                    }


                                    else if (
                                      dia.esFestivo &&
                                      dia.trabajado
                                    ) {

                                      fondo =
                                        "#F3E8FF";

                                      contenido =
                                        `🎉 ${segundosAHoras(
                                          dia.segundosReportados
                                        )}`;

                                      detalle =
                                        dia.esDomingo
                                          ? `${dia.festivoNombre} + Prima dominical`
                                          : dia.festivoNombre;
                                    }


                                    else if (
                                      dia.esFestivo &&
                                      !dia.trabajado
                                    ) {

                                      fondo =
                                        "#FAF5FF";

                                      contenido =
                                        "🎉 Descanso";

                                      detalle =
                                        dia.festivoNombre;
                                    }


                                    else if (
                                      dia.esFalta
                                    ) {

                                      fondo =
                                        "#FEE2E2";

                                      contenido =
                                        "❌ Falta";
                                    }


                                    else if (
                                      dia.esDomingo &&
                                      dia.trabajado
                                    ) {

                                      fondo =
                                        "#FFEDD5";

                                      contenido =
                                        `🟠 ${segundosAHoras(
                                          dia.segundosReportados
                                        )}`;

                                      detalle =
                                        "Prima dominical";
                                    }


                                    else if (
                                      dia.esDomingo
                                    ) {

                                      fondo =
                                        "#FFF7ED";

                                      contenido =
                                        "🛡️ Sin guardia";
                                    }


                                    else if (
                                      dia.esSabado &&
                                      dia.trabajado
                                    ) {

                                      fondo =
                                        "#DBEAFE";

                                      contenido =
                                        `🛡️ ${segundosAHoras(
                                          dia.segundosReportados
                                        )}`;
                                    }


                                    else if (
                                      dia.esSabado
                                    ) {

                                      fondo =
                                        "#EFF6FF";

                                      contenido =
                                        "🛡️ Sin guardia";
                                    }


                                    else if (
                                      dia.trabajado
                                    ) {

                                      if (
                                        dia.periodoAlto
                                      ) {

                                        fondo =
                                          "#FEF3C7";

                                        contenido =
                                          "⚠️ 08:00:00";

                                        detalle =
                                          `Reportado: ${segundosAHoras(
                                            dia.segundosReportados
                                          )}`;

                                      } else {

                                        fondo =
                                          "#F0FDF4";

                                        contenido =
                                          `✅ ${segundosAHoras(
                                            dia.segundosContabilizados
                                          )}`;
                                      }
                                    }


                                    return (

                                      <td
                                        key={
                                          fecha
                                        }

                                        style={{
                                          ...td,

                                          background:
                                            fondo,

                                          fontWeight:
                                            "800",
                                        }}
                                      >

                                        <div>
                                          {contenido}
                                        </div>


                                        {detalle && (

                                          <small
                                            style={{
                                              display:
                                                "block",

                                              marginTop:
                                                "4px",

                                              whiteSpace:
                                                "normal",

                                              color:
                                                theme.colors.textLight,
                                            }}
                                          >
                                            {detalle}
                                          </small>
                                        )}

                                      </td>
                                    );
                                  }
                                )}

                              </tr>
                            )
                          )}

                      </tbody>

                    </table>

                  </div>

                </div>

              </>
            )}

        </>
      )}

    </div>
  );
}


export default NominaPage;