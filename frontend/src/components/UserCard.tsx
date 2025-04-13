// src/components/UserCard.tsx
import React from "react";
import { UserCircleIcon } from "@heroicons/react/24/solid";
import { User } from "../context/AuthContext";

interface UserCardProps {
  user: User;
}

const UserCard: React.FC<UserCardProps> = ({ user }) => {
  return (
    <div className="card w-96 bg-base-100 shadow-xl mx-auto">
      {/* Encabezado / Figura */}
      <figure className="pt-6">
        {/* Si tuvieras una foto de perfil: 
        <img src={user.profilePic} alt="Foto de perfil" className="rounded-full w-24 h-24" /> */}

        {/* Mientras no haya foto, un ícono por defecto */}
        <UserCircleIcon className="h-24 w-24 text-gray-400" />
      </figure>
      {/* Cuerpo de la tarjeta */}
      <div className="card-body items-center text-center">
        <h2 className="card-title text-2xl">{user.username}</h2>
        {/* Email o datos adicionales */}
        <p className="text-gray-600">{user.email}</p>
        <p>
          <strong>Rol: </strong>
          {user.role}
        </p>
        <p>
          <strong>Creado el: </strong>
          {user.created_at}
        </p>
        {/* Acciones o botones opcionales */}
        <div className="card-actions mt-4">
          <button className="btn btn-primary">Editar</button>
          <button className="btn btn-outline">Cerrar Sesión</button>
        </div>
      </div>
    </div>
  );
};

export default UserCard;
