import React, { useContext, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  UserCircleIcon,
  NewspaperIcon,
  TrophyIcon,
  ArchiveBoxIcon,
} from "@heroicons/react/24/solid";
import { AuthContext } from "../context/AuthContext";

const Navbar: React.FC = () => {
  const { user, setUser } = useContext(AuthContext);
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) setUser(null);
  }, [location, setUser]);

  return (
    <nav
      className={`
        fixed top-0 left-0 bg-[#2C3E50] text-gray-100 shadow-md
        w-full h-16 flex items-center justify-around px-4
        md:flex md:flex-col md:justify-start md:py-8
        md:w-26 md:h-screen md:hover:w-64    /* altura completa + expandible */
        overflow-hidden
        transition-all duration-300 ease-in-out
        group                                 /* para group-hover */
      `}
    >
      {/* Logo / Home */}
      <Link to="/" className="flex items-center justify-center mb-4">
        <NewspaperIcon className="h-8 w-8 md:h-12 md:w-12" />
        <span
          className="
            ml-3 text-base font-medium
            opacity-0 group-hover:opacity-100 transition-opacity duration-300
          "
        >
          Inicio
        </span>
      </Link>
      <div>
        <ArchiveBoxIcon className="h-8 w-8 md:h-12 md:w-12" />
        <span
          className="
            ml-3 text-base font-medium
            opacity-0 group-hover:opacity-100 transition-opacity duration-300
          "
        >
          Resultados usuario
        </span>
      </div>

      {/* Enlaces */}
      <div className="flex items-center space-x-8 md:flex-col md:space-x-0 md:space-y-8 md:mt-8">
        <Link
          to="/stats"
          className="flex items-center justify-center hover:text-primary-light"
        >
          <TrophyIcon className="h-8 w-8 md:h-12 md:w-12" />
          <span
            className="
              ml-3 text-base font-medium
              opacity-0 group-hover:opacity-100 transition-opacity duration-300
            "
          >
            Ranking
          </span>
        </Link>

        <Link
          to={user ? "/profile" : "/login"}
          className="flex items-center justify-center hover:text-primary-light"
        >
          <UserCircleIcon className="h-8 w-8 md:h-12 md:w-12" />
          <span
            className="
              ml-3 text-base font-medium
              opacity-0 group-hover:opacity-100 transition-opacity duration-300
            "
          >
            {user ? "Perfil" : "Iniciar sesión"}
          </span>
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
