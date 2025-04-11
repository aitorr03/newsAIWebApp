import React from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logo.png"; // Asegúrate de ajustar la ruta relativa al archivo

const Navbar = () => {
  return (
    <nav className="fixed bg-blue-300 flex items-center justify-between p-4 shadow-md shadow-black top-0 left-0 w-full">
      <Link to="/">
        <img src={logo} alt="Logo" className="h-10 w-auto" />
      </Link>

      <Link to="/news" className="text-lg font-medium hover:text-blue-500">
        Portal de noticias
      </Link>

      <Link to="/profile" className="text-lg font-medium hover:text-blue-500">
        Perfil
      </Link>
    </nav>
  );
};

export default Navbar;
