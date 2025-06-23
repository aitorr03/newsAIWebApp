// src/pages/UserHistory.tsx
import React, { useState, useEffect, useContext } from "react";
import { axiosClient } from "../services/axiosClient";
import { AuthContext } from "../context/AuthContext";
import { Link } from "react-router-dom";
import {
  NewspaperIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/solid";
import { isAxiosError } from "axios";

interface NewsItem {
  id: string;
  title: string;
  date_analyzed?: string;
  primary_category?: string;
  result?: "Fake" | "Real";
  probability?: number;
}

interface HistoryItem {
  analysis_id: string;
  news?: NewsItem;
}

const UserHistory: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [historyList, setHistoryList] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setUnauthorized(true);
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        setUnauthorized(true);
        setLoading(false);
        return;
      }

      try {
        const res = await axiosClient.get("/users/me/history", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setHistoryList(res.data);
      } catch (err: any) {
        if (
          (isAxiosError(err) && err.response?.status === 401) ||
          err.message === "No token"
        ) {
          setUnauthorized(true);
        } else {
          setError(
            isAxiosError(err)
              ? err.response?.data?.detail || err.message
              : err.message
          );
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
        <p className="text-blue-600 text-lg">Cargando historial…</p>
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-white p-4">
        <NewspaperIcon className="h-16 w-16 text-blue-300 mb-4" />
        <p className="text-blue-700 text-xl mb-4">
          Para ver tu historial necesitas iniciar sesión.
        </p>
        <div className="flex gap-4">
          <Link
            to="/login"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
          >
            Iniciar Sesión
          </Link>
          <Link
            to="/login?mode=register"
            className="inline-block px-4 py-2 bg-white text-blue-600 border border-blue-600 rounded-lg shadow hover:bg-blue-50 transition"
          >
            Regístrate
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white p-4">
        <p className="flex items-center text-red-500">
          <ExclamationCircleIcon className="h-6 w-6 mr-2" />
          {error}
        </p>
      </div>
    );
  }

  if (!historyList.length) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-white p-4">
        <NewspaperIcon className="h-20 w-20 text-blue-200 mb-4" />
        <p className="text-gray-700 text-lg mb-4">
          Aún no has analizado noticias.
        </p>
        <Link
          to="/"
          className="px-6 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
        >
          Analizar Noticias
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl text-blue-700 font-extrabold text-center mb-8">
          Mi Historial
        </h1>
        <ul className="space-y-4">
          {historyList.map((item) => {
            const n = item.news!;
            return (
              <li
                key={item.analysis_id}
                className="bg-white rounded-lg shadow px-6 py-4 flex items-center justify-between hover:shadow-lg transition"
              >
                <div>
                  <h2 className="text-lg font-semibold text-blue-800 line-clamp-1">
                    {n.title}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {n.date_analyzed &&
                      new Date(n.date_analyzed).toLocaleString("es-ES", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                    • <span className="capitalize">{n.primary_category}</span>
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <span
                    className={`flex items-center px-2 py-1 rounded-full text-sm font-medium ${
                      n.result === "Fake"
                        ? "bg-red-100 text-red-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {n.result === "Fake" ? (
                      <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                    ) : (
                      <CheckCircleIcon className="h-4 w-4 mr-1" />
                    )}
                    {n.result}
                    {n.probability
                      ? ` (${(n.probability * 100).toFixed(1)}%)`
                      : ""}
                  </span>
                  <Link
                    to={`/news/${n.id}`}
                    className="text-blue-600 hover:underline font-semibold"
                  >
                    Ver
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default UserHistory;
