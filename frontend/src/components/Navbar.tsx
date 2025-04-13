// src/components/Navbar.tsx
import React, { useContext, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { UserCircleIcon, NewspaperIcon } from "@heroicons/react/24/solid";
import { AuthContext } from "../context/AuthContext";

const Navbar: React.FC = () => {
  const { user, setUser } = useContext(AuthContext);
  const location = useLocation();

  // Cada vez que se cambia de ruta, se puede volver a verificar si existe token
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUser(null);
    }
    // Opcional: Podrías agregar lógica para refrescar el perfil aquí si lo deseas.
  }, [location, setUser]);

  return (
    <div className="bg-[#2C3E50] fixed top-0 left-0 w-full z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-40">
          {/* Sección izquierda: Icono del portal */}
          <Link
            to="/"
            className="text-3xl font-medium text-gray-100 hover:text-primary-light transition-colors"
          >
            <NewspaperIcon className="h-14 w-14" />
          </Link>

          {/* Sección central: Portal de noticias */}
          <Link
            to="/news"
            className="text-3xl font-medium text-gray-100 hover:text-primary-light transition-colors"
          >
            Portal de noticias
          </Link>

          {/* Sección derecha: Condicional */}
          {user ? (
            <Link
              to="/profile"
              className="text-3xl font-medium text-gray-100 hover:text-primary-light transition-colors"
            >
              <UserCircleIcon className="h-14 w-14" />
            </Link>
          ) : (
            <Link
              to="/login"
              className="text-3xl font-medium text-gray-100 hover:text-primary-light transition-colors"
            >
              Registro / Iniciar sesión
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
