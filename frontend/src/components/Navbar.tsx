import { useContext, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  UserCircleIcon,
  NewspaperIcon,
  TrophyIcon,
} from "@heroicons/react/24/solid";
import { AuthContext } from "../context/AuthContext";

const Navbar = () => {
  const { user, setUser } = useContext(AuthContext);
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUser(null);
    }
  }, [location, setUser]);

  return (
    <nav
      className={`
        fixed top-0 left-0 bg-[#2C3E50] text-gray-100 shadow-md

        /* Móvil: barra horizontal */
        w-full h-16 flex items-center justify-around px-4

        /* Escritorio (>= md): barra vertical */
        md:w-32 md:h-screen md:flex md:flex-col md:justify-start md:py-8
      `}
    >
      {/* Logo / Home */}
      <Link to="/" className="flex items-center justify-center mb-4">
        <NewspaperIcon className="h-8 w-8 md:h-12 md:w-12" />
      </Link>

      {/* Enlaces */}
      <div
        className={`
          flex items-center space-x-12
          md:flex-col md:space-x-0 md:space-y-12 md:mt-8
        `}
      >
        <Link
          to="/stats"
          className="flex items-center justify-center hover:text-primary-light"
        >
          <TrophyIcon className="h-8 w-8 md:h-12 md:w-12" />
          <span className="ml-2 text-lg md:hidden">Ranking</span>
        </Link>

        {user ? (
          <Link
            to="/profile"
            className="flex items-center justify-center hover:text-primary-light"
          >
            <UserCircleIcon className="h-8 w-8 md:h-12 md:w-12" />
            <span className="ml-2 text-lg md:hidden">Perfil</span>
          </Link>
        ) : (
          <Link
            to="/login"
            className="flex items-center justify-center hover:text-primary-light"
          >
            <UserCircleIcon className="h-8 w-8 md:h-12 md:w-12" />
            <span className="ml-2 text-lg md:hidden">Iniciar sesión</span>
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
