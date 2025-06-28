import React, { useContext, useEffect, useState } from "react";
import { axiosClient } from "../services/axiosClient";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import {
  ExclamationCircleIcon,
  PencilSquareIcon,
  CheckCircleIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/solid";

const Profile: React.FC = () => {
  const { user, setUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const [formInitialized, setFormInitialized] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }
      try {
        const resp = await axiosClient.get("/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(resp.data);

        if (!formInitialized) {
          setForm({
            username: resp.data.username,
            email: resp.data.email,
            password: "",
          });
          setFormInitialized(true);
        }
      } catch {
        setError("No se pudo cargar tu perfil.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [navigate, setUser]);

  useEffect(() => {
    if (user && !formInitialized) {
      setForm({
        username: user.username,
        email: user.email,
        password: "",
      });
      setFormInitialized(true);
    }
  }, [user]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const payload: any = {
        username: form.username,
        email: form.email,
      };
      if (form.password) payload.password = form.password;

      await axiosClient.patch("/users/me", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser({ ...user!, username: form.username, email: form.email });
      setEditing(false);
    } catch (e: any) {
      setError(e.response?.data?.detail || "No se pudo actualizar.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
        <ArrowPathIcon className="h-8 w-8 text-blue-600 animate-spin" />
        <span className="ml-2 text-blue-600">Cargando perfil…</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
        <p className="text-gray-700">Usuario no autenticado.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white py-16 px-4">
      <div className="max-w-md mx-auto bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-8 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-extrabold text-blue-700">Mi Perfil</h2>
          <button
            onClick={() => setEditing((e) => !e)}
            className="
              p-2 bg-blue-600 hover:bg-blue-700 text-white
              rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-blue-300
              transition
            "
            title={editing ? "Cancelar edición" : "Editar perfil"}
          >
            <PencilSquareIcon className="h-5 w-5" />
          </button>
        </div>

        {editing ? (
          <div className="space-y-4">
            {error && <p className="text-red-500 text-center">{error}</p>}
            <div>
              <label className="block text-sm font-medium text-blue-800 mb-1">
                Nombre de usuario
              </label>
              <input
                name="username"
                value={form.username}
                onChange={onChange}
                className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-800 mb-1">
                Email
              </label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={onChange}
                className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-800 mb-1">
                Nueva contraseña{" "}
                <span className="text-xs text-gray-500">(opcional)</span>
              </label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={onChange}
                placeholder="********"
                className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <button
              onClick={save}
              disabled={saving}
              className={`w-full flex justify-center items-center gap-2 py-2
                bg-green-600 hover:bg-green-700 text-white
                border border-green-700 rounded-lg shadow-md
                focus:outline-none focus:ring-2 focus:ring-green-400
                transition ${saving ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <CheckCircleIcon className="h-5 w-5" />
              {saving ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl text-blue-600 font-bold">
                  {user.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <h3 className="text-2xl font-extrabold text-blue-700">
                {user.username}
              </h3>
              <p className="text-sm text-gray-600">{user.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="
                w-full py-2 bg-red-400 hover:bg-red-500 text-white
                rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-red-400
                transition
              "
            >
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
