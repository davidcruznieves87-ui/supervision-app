import { useState } from "react";

import {
  signInWithEmailAndPassword,
} from "firebase/auth";

import {
  auth,
} from "./firebase";

import logo from "./logo.png";

function Login() {

  const [correo, setCorreo] = useState("");

  const [password, setPassword] = useState("");

  const [mensaje, setMensaje] = useState("");

  const iniciarSesion = async () => {

    try {

      await signInWithEmailAndPassword(
        auth,
        correo,
        password
      );

    } catch (error) {

      console.log(error);

      setMensaje(
        "❌ Usuario o contraseña incorrectos"
      );
    }
  };

  return (

    <div className="min-h-screen bg-slate-100 flex justify-center items-center p-4">

      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">

        <div className="flex justify-center mb-6">

          <img
            src={logo}
            alt="logo"
            className="w-32 rounded-full shadow-xl"
          />

        </div>

        <h1 className="text-4xl font-black text-center text-slate-800 mb-2">
          Supervisión
        </h1>

        <p className="text-center text-gray-500 mb-8">
          Acceso de Supervisores
        </p>

        {mensaje && (

          <div className="bg-red-100 border border-red-300 text-red-700 p-4 rounded-2xl mb-5 text-center font-bold">
            {mensaje}
          </div>

        )}

        <input
          type="email"
          placeholder="📧 Correo"
          value={correo}
          onChange={(e) =>
            setCorreo(e.target.value)
          }
          className="w-full mb-4 bg-white border border-gray-300 rounded-2xl p-5 text-lg"
        />

        <input
          type="password"
          placeholder="🔒 Contraseña"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          className="w-full mb-6 bg-white border border-gray-300 rounded-2xl p-5 text-lg"
        />

        <button
          onClick={iniciarSesion}
          className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xl py-5 rounded-2xl shadow-xl"
        >
          Ingresar
        </button>

      </div>

    </div>
  );
}

export default Login;