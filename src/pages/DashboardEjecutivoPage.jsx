
import {
  useEffect,
  useState,
} from "react";

import {
  collection,
  getDocs,
} from "firebase/firestore";

import {
  BarChart3,
  Users,
  MapPin,
  Wrench,
  RefreshCcw,
  Activity,
} from "lucide-react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import { db } from "../firebase";

import theme from "../styles/theme";

function DashboardEjecutivoPage() {

  const [loading, setLoading] =
    useState(true);

  const [usuarios, setUsuarios] =
    useState([]);

  const [mantenimientos, setMantenimientos] =
    useState([]);

  const [rotaciones, setRotaciones] =
    useState([]);

  const [supervisiones, setSupervisiones] =
    useState([]);

  // 🔥 LOAD DATA
  const cargarDatos = async () => {

    try {

      const [
        usuariosSnap,
        mantenimientosSnap,
        rotacionesSnap,
        supervisionesSnap,
      ] = await Promise.all([

        getDocs(
          collection(
            db,
            "usuarios"
          )
        ),

        getDocs(
          collection(
            db,
            "mantenimientos"
          )
        ),

        getDocs(
          collection(
            db,
            "rotaciones"
          )
        ),

        getDocs(
          collection(
            db,
            "supervisiones"
          )
        ),

      ]);

      setUsuarios(
        usuariosSnap.docs.map(
          (d) => ({
            id: d.id,
            ...d.data(),
          })
        )
      );

      setMantenimientos(
        mantenimientosSnap.docs.map(
          (d) => ({
            id: d.id,
            ...d.data(),
          })
        )
      );

      setRotaciones(
        rotacionesSnap.docs.map(
          (d) => ({
            id: d.id,
            ...d.data(),
          })
        )
      );

      setSupervisiones(
        supervisionesSnap.docs.map(
          (d) => ({
            id: d.id,
            ...d.data(),
          })
        )
      );

    } catch (error) {

      console.log(error);

    } finally {

      setLoading(false);
    }
  };

  useEffect(() => {

    cargarDatos();

  }, []);

  // 🔥 KPIS
  const tecnicosActivos =
    usuarios.filter(
      (u) => u.rol === "tecnico"
    ).length;

  const supervisores =
    usuarios.filter(
      (u) => u.rol === "supervisor"
    ).length;

  const sitiosActivos =
    usuarios
      .filter(
        (u) => u.rol === "tecnico"
      )
      .reduce(
        (acc, item) =>
          acc +
          (
            item
              ?.sitiosAsignados
              ?.length || 0
          ),
        0
      );

  const dataRoles = [

    {
      name: "Técnicos",
      value: tecnicosActivos,
    },

    {
      name: "Supervisores",
      value: supervisores,
    },

  ];

  const dataOperativo = [

    {
      nombre: "Supervisiones",
      total:
        supervisiones.length,
    },

    {
      nombre: "Mantenimientos",
      total:
        mantenimientos.length,
    },

    {
      nombre: "Rotaciones",
      total:
        rotaciones.length,
    },

  ];

  const kpis = [

    {
      titulo:
        "Técnicos Activos",

      valor:
        tecnicosActivos,

      icono:
        Users,
    },

    {
      titulo:
        "Sitios Activos",

      valor:
        sitiosActivos,

      icono:
        MapPin,
    },

    {
      titulo:
        "Mantenimientos",

      valor:
        mantenimientos.length,

      icono:
        Wrench,
    },

    {
      titulo:
        "Rotaciones",

      valor:
        rotaciones.length,

      icono:
        RefreshCcw,
    },

  ];

  if (loading) {

    return (

      <div className="flex items-center justify-center min-h-screen text-4xl font-black text-cyan-700">

        🔄 Cargando Dashboard Ejecutivo...

      </div>
    );
  }

  return (

    <div className="space-y-10 animate-in fade-in duration-500">

      {/* HEADER */}
      <div
        style={theme.card}
        className="rounded-[36px] border border-slate-200/70 shadow-2xl backdrop-blur-xl bg-white/95 p-10 hover:shadow-cyan-100/50 transition-all duration-500"
      >

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

          <div>

            <h1
              style={theme.title}
              className="flex items-center gap-3 text-slate-800"
            >

              <BarChart3 size={40} />

              Dashboard Ejecutivo

            </h1>

            <p className="text-slate-500 text-lg font-semibold mt-3">

              Métricas operativas y KPIs del sistema enterprise

            </p>

          </div>

          <div className="bg-gradient-to-br from-cyan-500 to-blue-600 border border-cyan-400 rounded-[32px] px-10 py-6 shadow-2xl">

            <p className="text-cyan-100 font-black tracking-[0.3em] text-sm">

              ESTADO

            </p>

            <div className="flex items-center gap-3 mt-2">

              <Activity className="text-green-600" />

              <span className="font-black text-white text-2xl">

                OPERATIVO

              </span>

            </div>

          </div>

        </div>

      </div>

      {/* KPIS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

        {
          kpis.map(
            (item, index) => {

              const Icono =
                item.icono;

              return (

                <div
                  key={index}
                  style={theme.card}
                  className="rounded-[36px] border border-slate-200/70 shadow-2xl backdrop-blur-xl bg-white/95 p-10 hover:shadow-cyan-100/50 transition-all duration-500 hover:scale-[1.02] transition-all duration-300"
                >

                  <div className="flex items-center justify-between">

                    <div>

                      <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">

                        {item.titulo}

                      </p>

                      <h2 className="text-6xl font-black text-slate-800 mt-4">

                        {item.valor}

                      </h2>

                    </div>

                    <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-6 rounded-[28px] shadow-xl">

                      <Icono
                        size={40}
                        className="text-white"
                      />

                    </div>

                  </div>

                </div>
              );
            }
          )
        }

      </div>

    {/* CHARTS */}
<div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

  {/* BARRAS */}
  <div
    style={theme.card}
    className="
      rounded-[36px]
      border
      border-slate-200/70
      shadow-2xl
      bg-white
      p-10
      hover:shadow-cyan-100
      transition-all
      duration-500
    "
  >

    <div className="flex items-center justify-between mb-8">

      <div>

        <h2 className="text-3xl font-black text-slate-800">

          📊 Actividad Operativa

        </h2>

        <p className="text-slate-500 font-semibold mt-2">

          Supervisiones, mantenimientos y rotaciones

        </p>

      </div>

      <div
        className="
          bg-gradient-to-br
          from-cyan-500
          to-blue-600
          p-4
          rounded-3xl
          shadow-xl
        "
      >

        <BarChart3
          size={34}
          className="text-white"
        />

      </div>

    </div>

    <ResponsiveContainer
      width="100%"
      height={380}
    >

      <BarChart
        data={dataOperativo}
      >

        <XAxis
          dataKey="nombre"
          tick={{
            fill: "#334155",
            fontWeight: 700,
            fontSize: 14,
          }}
        />

        <YAxis
          tick={{
            fill: "#64748b",
            fontWeight: 600,
          }}
        />

        <Tooltip
          contentStyle={{
            borderRadius: 24,
            border: "none",
            boxShadow:
              "0 15px 40px rgba(0,0,0,0.12)",
            background: "#ffffff",
          }}
        />

        <Bar
          dataKey="total"
          radius={[20, 20, 0, 0]}
          fill="#06b6d4"
        />

      </BarChart>

    </ResponsiveContainer>

  </div>

  {/* PIE */}
  <div
    style={theme.card}
    className="
      rounded-[36px]
      border
      border-slate-200/70
      shadow-2xl
      bg-white
      p-10
      hover:shadow-cyan-100
      transition-all
      duration-500
    "
  >

    <div className="flex items-center justify-between mb-8">

      <div>

        <h2 className="text-3xl font-black text-slate-800">

          👥 Distribución Operativa

        </h2>

        <p className="text-slate-500 font-semibold mt-2">

          Técnicos y supervisores activos

        </p>

      </div>

      <div
        className="
          bg-gradient-to-br
          from-cyan-500
          to-blue-600
          p-4
          rounded-3xl
          shadow-xl
        "
      >

        <Users
          size={34}
          className="text-white"
        />

      </div>

    </div>

    <ResponsiveContainer
      width="100%"
      height={380}
    >

      <PieChart>

        <Pie
          data={dataRoles}
          dataKey="value"
          nameKey="name"
          outerRadius={130}
          innerRadius={65}
          paddingAngle={5}
          label
        >

          {
            dataRoles.map(
              (_, index) => (

                <Cell
                  key={index}
                  fill={
                    index === 0
                      ? "#06b6d4"
                      : "#3b82f6"
                  }
                />
              )
            )
          }

        </Pie>

        <Tooltip
          contentStyle={{
            borderRadius: 24,
            border: "none",
            boxShadow:
              "0 15px 40px rgba(0,0,0,0.12)",
            background: "#ffffff",
          }}
        />

      </PieChart>

    </ResponsiveContainer>

  </div>

</div>

      {/* RESUMEN */}
      <div
        style={theme.card}
        className="rounded-[36px] border border-slate-200/70 shadow-2xl backdrop-blur-xl bg-white/95 p-10 hover:shadow-cyan-100/50 transition-all duration-500"
      >

        <h2 className="text-3xl font-black text-slate-800 mb-8">

          📌 Resumen Ejecutivo

        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

          <div className="bg-gradient-to-br from-slate-50 to-cyan-50 rounded-[28px] p-7 border border-slate-200 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">

            <p className="text-slate-500 font-bold uppercase text-sm">

              Supervisiones

            </p>

            <p className="text-6xl font-black bg-gradient-to-r from-cyan-600 to-blue-700 bg-clip-text text-transparent mt-4">

              {supervisiones.length}

            </p>

          </div>

          <div className="bg-gradient-to-br from-slate-50 to-cyan-50 rounded-[28px] p-7 border border-slate-200 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">

            <p className="text-slate-500 font-bold uppercase text-sm">

              Rotaciones

            </p>

            <p className="text-6xl font-black bg-gradient-to-r from-cyan-600 to-blue-700 bg-clip-text text-transparent mt-4">

              {rotaciones.length}

            </p>

          </div>

          <div className="bg-gradient-to-br from-slate-50 to-cyan-50 rounded-[28px] p-7 border border-slate-200 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">

            <p className="text-slate-500 font-bold uppercase text-sm">

              Usuarios

            </p>

            <p className="text-6xl font-black bg-gradient-to-r from-cyan-600 to-blue-700 bg-clip-text text-transparent mt-4">

              {usuarios.length}

            </p>

          </div>

          <div className="bg-gradient-to-br from-slate-50 to-cyan-50 rounded-[28px] p-7 border border-slate-200 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">

            <p className="text-slate-500 font-bold uppercase text-sm">

              Sitios

            </p>

            <p className="text-6xl font-black bg-gradient-to-r from-cyan-600 to-blue-700 bg-clip-text text-transparent mt-4">

              {sitiosActivos}

            </p>

          </div>

        </div>

      </div>

    </div>
  );
}

export default DashboardEjecutivoPage;

