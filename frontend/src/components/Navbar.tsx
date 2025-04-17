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
    <div className="navbar bg-[#2C3E50] fixed top-0 left-0 shadow-md flex items-center justify-between h-40">
      <Link
        to="/"
        className="text-3xl font-medium text-gray-100 hover:text-primary-light ml-8"
      >
        <NewspaperIcon className="h-14 w-14" />
      </Link>
      <Link
        to="/stats"
        className="inline-flex items-center space-x-2 text-3xl font-medium text-gray-100 hover:text-primary-light"
      >
        <TrophyIcon className="h-8 w-8" />
        <span>Ranking</span>
      </Link>
      {user ? (
        <Link
          to="/profile"
          className="text-3xl font-medium text-gray-100 hover:text-primary-light  mr-8"
        >
          <UserCircleIcon className="h-14 w-14" />
        </Link>
      ) : (
        <Link
          to="/login"
          className="text-3xl font-medium text-gray-100 hover:text-primary-light mr-8"
        >
          Iniciar sesión
        </Link>
      )}
    </div>
  );
};

export default Navbar;
