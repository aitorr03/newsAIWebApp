import React, { useState, useContext, FormEvent } from "react";
import axios from "axios";
import { UserCircleIcon } from "@heroicons/react/24/solid";
import { AuthContext, User } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

interface UserCardProps {
  user: User;
}

const UserCard: React.FC<UserCardProps> = ({ user }) => {
  const { setUser } = useContext(AuthContext);
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email || "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleEditClick = () => {
    setIsEditing(true);
    setPassword("");
    setError("");
  };

  const handleCancel = () => {
    setIsEditing(false);
    setUsername(user.username);
    setEmail(user.email || "");
    setPassword("");
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token");
      const payload: any = { username, email };
      if (password.trim()) payload.hashed_password = password;

      const response = await axios.patch(
        `http://127.0.0.1:8000/users/me`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      // Actualizamos el contexto y salimos de edición
      setUser(response.data);
      setIsEditing(false);
    } catch (err: any) {
      console.error(err);
      setError("No se pudo guardar. Revisa los datos e inténtalo de nuevo.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="card w-96 mx-auto  ">
      <div
        className="w-full mx-auto px-8 mt-100 border rounded-4xl
      hover:scale-105 transition-transform duration-300 bg-base-100 shadow-xl transform border-gray-200"
      >
        <figure className="pt-6">
          <UserCircleIcon className="h-24 w-24 text-gray-400" />
        </figure>

        <div className="card-body items-center">
          {isEditing ? (
            <form onSubmit={handleSave} className="w-full px-6">
              {error && (
                <p className="text-red-500 text-sm mb-2 text-center">{error}</p>
              )}
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Usuario</span>
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="input input-bordered"
                />
              </div>
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Correo</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="input input-bordered"
                />
              </div>
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Contraseña</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Dejar en blanco = sin cambio"
                  className="input input-bordered"
                />
              </div>

              <div className="card-actions justify-between mt-6">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="btn btn-outline"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Guardar
                </button>
              </div>
            </form>
          ) : (
            <>
              <h2 className="card-title text-2xl text-primary-dark">
                {user.username}
              </h2>
              <p className="text-gray-600">{user.email}</p>
              <p className="mt-2 text-sm text-gray-500">
                <strong>Creado el:</strong>{" "}
                {new Date(user.created_at).toLocaleDateString()}
              </p>
              <div className="card-actions justify-between mt-6 px-6">
                <button className="btn btn-primary" onClick={handleEditClick}>
                  Editar Perfil
                </button>
                <button className="btn btn-outline" onClick={handleLogout}>
                  Cerrar Sesión
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserCard;
