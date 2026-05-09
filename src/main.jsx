import React from "react";
import ReactDOM from "react-dom/client";

import "./index.css";

import App from "./App";
import Login from "./Login";

import { auth } from "./firebase";

import {
  onAuthStateChanged,
} from "firebase/auth";

const root = ReactDOM.createRoot(
  document.getElementById("root")
);

function Root() {

  const [user, setUser] = React.useState(undefined);

  React.useEffect(() => {

    const unsubscribe =
      onAuthStateChanged(auth, (u) => {

        setUser(u);
      });

    return () => unsubscribe();

  }, []);

  // 🔥 CARGANDO
  if (user === undefined) {

    return (
      <div className="min-h-screen flex items-center justify-center text-3xl font-black">
        Cargando...
      </div>
    );
  }

  return user ? <App /> : <Login />;
}

root.render(

  <React.StrictMode>
    <Root />
  </React.StrictMode>
);