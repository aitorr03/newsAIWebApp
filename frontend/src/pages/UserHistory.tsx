import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { Link } from "react-router-dom";
import {
  NewspaperIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/solid";

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  primary_category?: string;
  secondary_category?: string;
  url?: string;
  source?: string;
  date_analyzed?: string;
  result?: "Fake" | "Real";
  probability?: number;
  query_count?: number;
}

interface HistoryItem {
  analysis_id: string;
  date_analyzed?: string;
  result?: "Fake" | "Real";
  news?: NewsItem;
}

const UserHistory: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [historyList, setHistoryList] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Solo intentamos cargar historial si hay usuario
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No se encontró token de autenticación");

        const response = await axios.get<HistoryItem[]>(
          "http://127.0.0.1:8000/users/me/history",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setHistoryList(response.data);
      } catch (err: any) {
        console.error("Error al obtener historial:", err);
        const msg =
          err.response?.data?.detail ||
          err.response?.data?.message ||
          err.message ||
          "Ocurrió un error inesperado";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user]);

  // Si todavía estamos “cargando” estado inicial (antes de saber si hay usuario o no)
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600 text-lg">Cargando…</p>
      </div>
    );
  }

  // Si no hay usuario, mostramos el mensaje e invitamos a registrarse
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-gray-700 text-lg mb-4">
          Debes estar registrado para ver tu historial.
        </p>
        <Link
          to="/login"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        >
          Ir a Registro
        </Link>
      </div>
    );
  }

  // Si hay error al cargar el historial
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-red-500 text-center flex items-center">
          <ExclamationCircleIcon className="h-6 w-6 mr-1 text-red-500" />
          {error}
        </p>
      </div>
    );
  }

  // Si el usuario no ha analizado ninguna noticia aún
  if (historyList.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <NewspaperIcon className="h-16 w-16 text-gray-400 mb-4" />
        <p className="text-gray-700 text-lg mb-3">
          Aún no has analizado ninguna noticia.
        </p>
        <Link
          to="/"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        >
          Ir a Analizar noticias
        </Link>
      </div>
    );
  }

  // Renderizado de la lista de histórico
  return (
    <div className="max-w-5xl mx-auto p-4 mt-20">
      <h1 className="text-2xl font-semibold mb-6 text-center">
        Mi Historial de Noticias Analizadas
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {historyList.map((item) => {
          const news = item.news;
          return (
            <div
              key={item.analysis_id}
              className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
            >
              {/* Si no hay noticia asociada, mostramos un mensaje */}
              {!news ? (
                <p className="text-red-500 text-center">
                  No se encontró la noticia asociada
                </p>
              ) : (
                <>
                  {/* Título de la noticia */}
                  <h2 className="text-xl font-semibold mb-2 line-clamp-2">
                    {news.title}
                  </h2>

                  {/* Fecha en que se hizo el análisis */}
                  {item.date_analyzed && (
                    <p className="text-sm text-gray-500 mb-1">
                      Analizada:{" "}
                      {new Date(item.date_analyzed).toLocaleDateString(
                        "es-ES",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </p>
                  )}

                  {/* Categoría principal de la noticia */}
                  {news.primary_category && (
                    <p className="text-sm text-gray-500 mb-2">
                      Categoría:{" "}
                      <span className="capitalize">
                        {news.primary_category}
                      </span>
                    </p>
                  )}

                  {/* Resumen de la noticia */}
                  <p className="text-gray-700 text-sm mb-3 line-clamp-3">
                    {news.summary}
                  </p>

                  <div className="flex items-center justify-between mt-4">
                    {/* Badge Falsa / Real según el resultado del análisis (item.result) */}
                    {item.result === "Fake" ? (
                      <span className="flex items-center px-2 py-1 bg-red-100 text-red-700 text-sm font-medium rounded">
                        <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                        Falsa{" "}
                        {news.probability !== undefined
                          ? `(${(news.probability * 100).toFixed(1)}%)`
                          : ""}
                      </span>
                    ) : (
                      <span className="flex items-center px-2 py-1 bg-green-100 text-green-700 text-sm font-medium rounded">
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        Real{" "}
                        {news.probability !== undefined
                          ? `(${((1 - news.probability) * 100).toFixed(1)}%)`
                          : ""}
                      </span>
                    )}

                    {/* Enlace a la página de detalle de la noticia */}
                    <Link
                      to={`/news/${news.id}`}
                      className="text-blue-500 hover:underline text-sm"
                    >
                      Ver detalle →
                    </Link>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UserHistory;
