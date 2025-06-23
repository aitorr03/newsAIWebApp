import React, { useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  HomeIcon,
  ArchiveBoxIcon,
  GlobeEuropeAfricaIcon,
  UserCircleIcon,
  ArrowRightStartOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { AuthContext } from "../context/AuthContext";

const navColor = "bg-[#12355B]";
const iconCircleColor = "bg-[#747bff]";

const navItems = [
  { to: "/", icon: <HomeIcon />, label: "Inicio" },
  { to: "/history", icon: <ArchiveBoxIcon />, label: "Historial" },
  { to: "/news/portal", icon: <GlobeEuropeAfricaIcon />, label: "Noticias" },
];

const NavbarHorizontal: React.FC = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  return (
    <nav
      className={`
        ${navColor} fixed top-0 left-0 w-full h-16
        shadow-lg flex items-center px-6 z-20
      `}
    >
      {/* Logo */}
      <Link to="/" className="flex items-center mr-8">
        <img
          src="/images/logo1.png"
          alt="Logo"
          className="w-10 h-10 rounded-full border-2 border-white shadow"
        />
      </Link>

      {/* Enlaces centrales */}
      <ul className="flex flex-1 gap-6">
        {navItems.map((item) => {
          const active = location.pathname === item.to;
          return (
            <li key={item.to}>
              <Link
                to={item.to}
                className="flex flex-col items-center text-white transition group"
              >
                <div
                  className={`
                    ${iconCircleColor} w-10 h-10 rounded-full 
                    flex items-center justify-center shadow-md
                    transition-all
                    ${active ? "ring-2 ring-white" : "opacity-80"}
                    group-hover:ring-2 group-hover:ring-white
                  `}
                >
                  {React.cloneElement(item.icon, {
                    className: `w-5 h-5 ${
                      active ? "stroke-white" : "stroke-white/80"
                    }`,
                  })}
                </div>
                <span
                  className={`
                    text-xs mt-1 font-medium transition-all
                    ${active ? "text-white" : "text-white/80"}
                    group-hover:text-white
                  `}
                >
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Perfil / Login */}
      <div className="flex items-center gap-6">
        <Link
          to={user ? "/profile" : "/login"}
          className="flex flex-col items-center text-white transition group"
        >
          <div
            className={`
              ${iconCircleColor} w-10 h-10 rounded-full
              flex items-center justify-center shadow-md
            `}
          >
            <UserCircleIcon className="w-6 h-6 stroke-white" />
          </div>
          <span className="text-xs mt-1">{user ? "Perfil" : "Acceder"}</span>
        </Link>
        {user && (
          <button title="Cerrar sesión">
            <div
              className={`
                ${iconCircleColor} w-10 h-10 rounded-full
                flex items-center justify-center shadow-md
              `}
            >
              <ArrowRightStartOnRectangleIcon className="w-6 h-6 stroke-white" />
            </div>
          </button>
        )}
      </div>
    </nav>
  );
};

export default NavbarHorizontal;
