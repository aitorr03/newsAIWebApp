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

const navColor = "bg-[#12355B]"; // O usa "bg-indigo-500" si prefieres Tailwind puro
const iconCircleColor = "bg-[#747bff]"; // Un poco más claro para contraste, o "bg-indigo-400"

const navItems = [
  { to: "/", icon: <HomeIcon />, label: "Inicio" },
  { to: "/history", icon: <ArchiveBoxIcon />, label: "Historial" },
  { to: "/news/portal", icon: <GlobeEuropeAfricaIcon />, label: "Noticias" },
];

const Navbar: React.FC = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  return (
    <nav
      className={`${navColor} fixed left-0 top-0 h-screen w-20 shadow-lg flex flex-col items-center py-8 z-20`}
    >
      {/* Logo */}
      <Link to="/" className="mb-12 flex items-center">
        <img
          src="/images/logo1.png"
          alt="Logo"
          className="w-10 h-10 rounded-full border-2 border-white shadow"
        />
      </Link>
      {/* Nav items */}
      <div className="flex flex-col gap-8 flex-1">
        {navItems.map((item) => {
          const active = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className="flex flex-col items-center group transition"
            >
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center shadow-md transition-all
                  ${iconCircleColor} 
                  ${active ? "ring-2 ring-white" : "opacity-80"}
                  group-hover:ring-2 group-hover:ring-white`}
              >
                {React.cloneElement(item.icon, {
                  className: `w-6 h-6 ${
                    active ? "stroke-white" : "stroke-white/80"
                  }`,
                })}
              </div>
              <span
                className={`text-xs mt-2 font-medium transition-all 
                  ${active ? "text-white" : "text-white/80"} 
                  group-hover:text-white`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
      {/* Perfil/Login */}
      <div className="mt-auto flex flex-col items-center gap-3 mb-2">
        <Link
          to={user ? "/profile" : "/login"}
          className="flex flex-col items-center"
        >
          <div
            className={`${iconCircleColor} w-11 h-11 rounded-full flex items-center justify-center shadow-md`}
          >
            <UserCircleIcon className="w-7 h-7 stroke-white" />
          </div>
          <span className="text-xs mt-1 text-white">
            {user ? "Perfil" : "Acceder"}
          </span>
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
