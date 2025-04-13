// src/pages/Profile.tsx
import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import UserCard from "../components/UserCard";

const Profile: React.FC = () => {
  const { user, setUser } = useContext(AuthContext);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }
      try {
        const response = await axios.get("http://127.0.0.1:8000/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(response.data);
      } catch (err) {
        console.error("Error al cargar el perfil:", err);
        setError("Error al cargar el perfil");
      }
    };

    if (!user) {
      fetchProfile();
    }
  }, [navigate, setUser, user]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-start justify-center pt-40 bg-gray-100">
      <UserCard user={user!} />
    </div>
  );
};

export default Profile;
