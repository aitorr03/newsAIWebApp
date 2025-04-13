import React, { useState, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState(""); // Solo para registro
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { setUser } = useContext(AuthContext);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (isRegister) {
      try {
        const response = await axios.post(
          "http://127.0.0.1:8000/users/register",
          {
            username,
            email,
            hashed_password: password,
          }
        );
        alert("Usuario registrado correctamente");
        // Actualizar el contexto con valores por defecto o los obtenidos de la API.
        setUser({
          id: response.data.user_id,
          username,
          email,
          role: "usuario",
          created_at: new Date().toISOString(),
        });
        navigate("/profile");
      } catch (err) {
        setError("Error en el registro, verifique los datos");
      }
    } else {
      try {
        const formData = new URLSearchParams();
        formData.append("username", username);
        formData.append("password", password);

        const response = await axios.post(
          "http://127.0.0.1:8000/users/login",
          formData,
          {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
          }
        );
        localStorage.setItem("token", response.data.access_token);
        // Actualiza el contexto del usuario con valores predeterminados.
        setUser({
          id: "123", // Si tienes un valor real, úsalo
          username,
          email: "",
          role: "usuario",
          created_at: new Date().toISOString(),
        });
        navigate("/profile");
      } catch (err) {
        setError("Credenciales inválidas");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="max-w-md w-full bg-white p-8 rounded shadow">
        <h2 className="text-2xl font-bold text-center mb-6">
          {isRegister ? "Registro" : "Iniciar sesión"}
        </h2>
        {error && <div className="mb-4 text-red-500">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700">Nombre de usuario</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring"
            />
          </div>
          {isRegister && (
            <div className="mb-4">
              <label className="block text-gray-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring"
              />
            </div>
          )}
          <div className="mb-6">
            <label className="block text-gray-700">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition"
          >
            {isRegister ? "Registrar" : "Iniciar sesión"}
          </button>
        </form>
        <div className="mt-4 text-center">
          {isRegister ? (
            <span>
              ¿Ya tienes cuenta?{" "}
              <button
                onClick={() => setIsRegister(false)}
                className="text-blue-500 hover:underline"
              >
                Iniciar sesión
              </button>
            </span>
          ) : (
            <span>
              ¿No tienes cuenta?{" "}
              <button
                onClick={() => setIsRegister(true)}
                className="text-blue-500 hover:underline"
              >
                Registrarse
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
