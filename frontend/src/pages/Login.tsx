import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";

// Validación de username: min 6, max 12, solo letras, números, guion y guion_bajo
const USERNAME_REGEX = /^[a-zA-Z0-9_-]{6,12}$/;

const Login: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState(""); // solo para registro
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [usernameError, setUsernameError] = useState(""); // Para feedback solo en submit
  const [success, setSuccess] = useState(""); // Para mensaje de éxito
  const navigate = useNavigate();
  const { setUser } = useContext(AuthContext);

  const resetStates = () => {
    setError("");
    setSuccess("");
    setUsernameError("");
    setPassword("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setUsernameError("");

    if (
      isRegister &&
      (!USERNAME_REGEX.test(username) || username.length === 0)
    ) {
      setUsernameError(
        "El usuario debe tener entre 6 y 12 caracteres y solo puede contener letras, números '-' y '_'."
      );
      return;
    }

    try {
      if (isRegister) {
        const resp = await axios.post("http://127.0.0.1:8000/users/register", {
          username,
          email,
          password,
        });
        setSuccess("¡Registro exitoso! Ahora puedes iniciar sesión.");
        setIsRegister(false);
        setUsername("");
        setEmail("");
        setPassword("");
      } else {
        const form = new URLSearchParams();
        form.append("username", username);
        form.append("password", password);

        const resp = await axios.post(
          "http://127.0.0.1:8000/users/login",
          form,
          {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
          }
        );

        localStorage.setItem("token", resp.data.access_token);
        setUser({
          id: "",
          username,
          email: "",
          role: "usuario",
          created_at: new Date().toISOString(),
        });
        navigate("/profile");
      }
    } catch (err: any) {
      setError(
        isRegister
          ? "Error en el registro. ¿El usuario o email ya existen?"
          : "Credenciales inválidas"
      );
    }
  };

  // El botón solo se bloquea por campos vacíos
  const isDisabled = !username || !password || (isRegister && !email);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-8">
        <h2 className="text-3xl font-extrabold text-blue-700 text-center mb-6">
          {isRegister ? "Crea tu cuenta" : "Inicia sesión"}
        </h2>

        {success && (
          <div className="mb-4 text-center text-green-600 font-medium">
            {success}
          </div>
        )}

        {error && (
          <div className="mb-4 text-center text-red-600 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-blue-800 mb-1">
              Nombre de usuario
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (usernameError) setUsernameError("");
              }}
              className={`w-full px-4 py-2 border ${
                usernameError && isRegister
                  ? "border-red-400"
                  : "border-blue-200"
              } rounded-lg focus:outline-none focus:ring-2 ${
                usernameError && isRegister
                  ? "focus:ring-red-400"
                  : "focus:ring-blue-300"
              }`}
            />
            {isRegister && usernameError && (
              <p className="mt-1 text-xs text-red-500">{usernameError}</p>
            )}
          </div>

          {isRegister && (
            <div>
              <label className="block text-sm font-medium text-blue-800 mb-1">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-blue-800 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>

          <button
            type="submit"
            disabled={isDisabled}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow transition disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
          >
            {isRegister ? "Registrar" : "Iniciar sesión"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          {isRegister ? (
            <>
              ¿Ya tienes cuenta?{" "}
              <button
                type="button"
                onClick={() => {
                  setIsRegister(false);
                  resetStates();
                }}
                className="text-blue-600 hover:underline font-semibold"
              >
                Inicia sesión
              </button>
            </>
          ) : (
            <>
              ¿No tienes cuenta?{" "}
              <button
                type="button"
                onClick={() => {
                  setIsRegister(true);
                  resetStates();
                }}
                className="text-blue-600 hover:underline font-semibold"
              >
                Regístrate
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
