// src/pages/NewsDetail.tsx
import React, { useState, useEffect, useContext, FormEvent } from "react";
import { axiosClient } from "../services/axiosClient";
import { useParams, Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import {
  ExclamationCircleIcon,
  CheckCircleIcon,
  PencilSquareIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/solid";

interface News {
  id: string;
  title: string;
  summary: string;
  primary_category: string;
  secondary_category?: string;
  url?: string;
  date_analyzed: string;
  result: "Fake" | "Real";
  probability: number;
  query_count: number;
}

interface Comment {
  id: string;
  user_id: string;
  user_username: string;
  text: string;
  created_at: string;
  edited_at?: string;
}

const NewsDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [news, setNews] = useState<News | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loadingNews, setLoadingNews] = useState(true);
  const [loadingComments, setLoadingComments] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Para edición inline
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  useEffect(() => {
    // Cargar noticia
    (async () => {
      setLoadingNews(true);
      try {
        const res = await axiosClient.get<News>(`api/news/${id}`);
        setNews(res.data);
      } catch {
        setError("No se pudo cargar la noticia.");
      } finally {
        setLoadingNews(false);
      }
    })();

    // Cargar comentarios
    (async () => {
      setLoadingComments(true);
      try {
        const res = await axiosClient.get<Comment[]>("api/comments/", {
          params: { news_id: id, page: 1, limit: 50 },
        });
        setComments(res.data);
      } catch {
        // Silenciar
      } finally {
        setLoadingComments(false);
      }
    })();
  }, [id]);

  const handleNewSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;
    setSubmitting(true);
    try {
      const res = await axiosClient.post<Comment>(
        "api/comments/",
        { news_id: id, text: newComment },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setComments([res.data, ...comments]);
      setNewComment("");
    } catch {
      setError("No se pudo enviar el comentario.");
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (c: Comment) => {
    setEditingId(c.id);
    setEditText(c.text);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const submitEdit = async (cid: string) => {
    if (!editText.trim() || !user) return;
    try {
      const res = await axiosClient.patch<Comment>(
        `api/comments/${cid}`,
        { text: editText },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setComments((cs) => cs.map((c) => (c.id === cid ? res.data : c)));
      cancelEdit();
    } catch {
      setError("No se pudo editar el comentario.");
    }
  };

  if (loadingNews) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
        <ArrowPathIcon className="h-10 w-10 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error && !news) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-white p-4">
        <ExclamationCircleIcon className="h-12 w-12 text-red-500 mb-2" />
        <p className="text-red-600 text-lg mb-4">{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow"
        >
          Volver atrás
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Breadcrumbs */}
        <nav className="flex text-sm text-blue-600 space-x-2">
          <Link to="/portal" className="hover:underline">
            Portal
          </Link>
          <span>/</span>
          <Link to="/history" className="hover:underline">
            Historial
          </Link>
          <span>/</span>
          <span className="text-gray-600">Detalle</span>
        </nav>

        {/* Detalle de la noticia */}
        {news && (
          <article className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 space-y-4">
            <h1 className="text-3xl font-extrabold text-blue-700">
              {news.title}
            </h1>
            <div className="flex flex-wrap gap-2 text-sm text-gray-500">
              <span>
                Analizada:{" "}
                {new Date(news.date_analyzed).toLocaleDateString("es-ES", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
              <span className="uppercase font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                {news.primary_category}
              </span>
              {news.secondary_category && (
                <span className="uppercase font-semibold bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                  {news.secondary_category}
                </span>
              )}
            </div>
            <p className="text-gray-800">{news.summary}</p>
            <div className="flex items-center justify-between">
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 ${
                  news.result === "Fake"
                    ? "bg-red-100 text-red-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {news.result === "Fake" ? (
                  <ExclamationCircleIcon className="h-4 w-4" />
                ) : (
                  <CheckCircleIcon className="h-4 w-4" />
                )}
                {(news.probability * 100).toFixed(1)}%
              </span>
              {news.url && (
                <a
                  href={news.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline text-sm font-medium"
                >
                  Ver fuente ↗
                </a>
              )}
            </div>
          </article>
        )}

        {/* Comentarios */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-blue-700">Comentarios</h2>

          {/* Nuevo comentario */}
          <form onSubmit={handleNewSubmit} className="space-y-4">
            {error && <p className="text-red-600">{error}</p>}

            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
              placeholder={
                user
                  ? "Escribe tu comentario..."
                  : "Inicia sesión para comentar"
              }
              disabled={!user}
              className="w-full bg-white border border-gray-300 rounded-lg p-4 focus:ring-2 focus:ring-blue-300 resize-none disabled:opacity-50"
            />

            {user ? (
              <button
                type="submit"
                disabled={submitting}
                className={`bg-blue-600 text-white px-6 py-2 rounded-lg shadow transition ${
                  submitting
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-blue-700"
                }`}
              >
                {submitting ? "Enviando…" : "Comentar"}
              </button>
            ) : (
              <Link
                to="/login"
                className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg shadow hover:bg-blue-700 transition"
              >
                Iniciar sesión
              </Link>
            )}
          </form>

          {/* Loader comentarios */}
          {loadingComments ? (
            <p className="text-gray-600 text-center">Cargando comentarios…</p>
          ) : comments.length === 0 ? (
            <p className="text-gray-500">Sé el primero en comentar.</p>
          ) : (
            <ul className="space-y-4">
              {comments.map((c) => (
                <li
                  key={c.id}
                  className="bg-white/90 backdrop-blur-sm rounded-lg shadow p-4 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold">
                          {c.user_username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-blue-700 text-sm">
                          {c.user_username}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(c.created_at).toLocaleString("es-ES", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {c.edited_at && (
                            <span className="ml-2 text-xs italic text-gray-400">
                              (editado{" "}
                              {new Date(c.edited_at).toLocaleTimeString(
                                "es-ES"
                              )}
                              )
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    {/* Botón editar */}
                    {user && c.user_id === user.id && editingId !== c.id && (
                      <button
                        onClick={() => startEdit(c)}
                        className="text-gray-500 hover:text-gray-700"
                        title="Editar comentario"
                      >
                        <PencilSquareIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>

                  {/* Vista / edición */}
                  {editingId === c.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        rows={2}
                        className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-300 resize-none"
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={() => submitEdit(c.id)}
                          className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="bg-gray-300 px-4 py-1 rounded hover:bg-gray-400"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-800">{c.text}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};

export default NewsDetail;
