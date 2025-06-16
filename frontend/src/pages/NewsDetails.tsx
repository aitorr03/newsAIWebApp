// src/pages/NewsDetail.tsx
import React, { useState, useEffect, useContext, FormEvent } from "react";
import axios from "axios";
import { useParams, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

interface News {
  id: string;
  title: string;
  summary: string;
  primary_category: string;
  secondary_category?: string;
  url?: string;
  source?: string;
  date_analyzed: string;
  result: "Fake" | "Real";
  probability: number;
  query_count: number;
}

interface Comment {
  id: string;
  user_id: string;
  text: string;
  created_at: string;
  edited_at?: string;
}

const NewsDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useContext(AuthContext);

  const [news, setNews] = useState<News | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [page, setPage] = useState(1);
  const [newComment, setNewComment] = useState("");
  const [loadingNews, setLoadingNews] = useState(true);
  const [loadingComments, setLoadingComments] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carga de la noticia
  useEffect(() => {
    setLoadingNews(true);
    axios
      .get<News>(`http://127.0.0.1:8000/news/${id}`)
      .then((res) => setNews(res.data))
      .catch((e) => setError("No se pudo cargar la noticia"))
      .finally(() => setLoadingNews(false));
  }, [id]);

  // Carga de comentarios
  const loadComments = (page: number) => {
    setLoadingComments(true);
    axios
      .get<Comment[]>("http://127.0.0.1:8000/comments", {
        params: { news_id: id, page, limit: 10 },
      })
      .then((res) =>
        setComments((prev) => (page === 1 ? res.data : [...prev, ...res.data]))
      )
      .catch((e) => console.error("Error cargando comentarios", e))
      .finally(() => setLoadingComments(false));
  };

  useEffect(() => {
    loadComments(1);
  }, [id]);

  // Envío de un nuevo comentario
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmitting(true);
    axios
      .post<Comment>(
        "http://127.0.0.1:8000/comments/",
        { news_id: id, text: newComment },
        {
          headers: user
            ? { Authorization: `Bearer ${localStorage.getItem("token")}` }
            : {},
        }
      )
      .then((res) => {
        setComments([res.data, ...comments]);
        setNewComment("");
      })
      .catch((e) => {
        console.error("Error enviando comentario", e);
        setError("No se pudo enviar el comentario");
      })
      .finally(() => setSubmitting(false));
  };

  if (loadingNews) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-gray-600">Cargando noticia…</span>
      </div>
    );
  }

  if (!news) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-red-500">Noticia no encontrada</span>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Detalle de la noticia */}
      <article className="bg-white rounded-lg shadow p-6 mb-8">
        <h1 className="text-3xl font-bold mb-2">{news.title}</h1>
        <p className="text-sm text-gray-500 mb-4">
          Analizada el{" "}
          {new Date(news.date_analyzed).toLocaleDateString("es-ES", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}{" "}
          • <span className="uppercase">{news.primary_category}</span>{" "}
          {news.secondary_category && (
            <span className="uppercase">/ {news.secondary_category}</span>
          )}
        </p>
        <p className="text-gray-700 mb-4">{news.summary}</p>
        <div className="flex items-center justify-between">
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              news.result === "Fake"
                ? "bg-red-100 text-red-700"
                : "bg-green-100 text-green-700"
            }`}
          >
            {news.result} ({(news.probability * 100).toFixed(1)}%)
          </span>
          {news.url && (
            <a
              href={news.url}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 hover:underline text-sm"
            >
              Ver fuente
            </a>
          )}
        </div>
      </article>

      {/* Sección de comentarios */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Comentarios</h2>

        {/* Formulario de nuevo comentario */}
        {user ? (
          <form onSubmit={handleSubmit} className="mb-6">
            {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
              placeholder="Escribe tu comentario..."
              className="w-full bg-gray-100 border border-gray-300 rounded-lg p-3 text-gray-800 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
            />
            <button
              type="submit"
              disabled={submitting}
              className={`bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg shadow ${
                submitting
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-blue-700"
              }`}
            >
              {submitting ? "Enviando…" : "Comentar"}
            </button>
          </form>
        ) : (
          <p className="mb-6 text-gray-600">
            Debes{" "}
            <Link to="/login" className="text-blue-600 hover:underline">
              iniciar sesión
            </Link>{" "}
            para poder comentar.
          </p>
        )}

        {/* Lista de comentarios */}
        {loadingComments && (
          <p className="text-gray-600 text-center">Cargando comentarios…</p>
        )}
        {!loadingComments && comments.length === 0 && (
          <p className="text-gray-500">
            Sé el primero en comentar esta noticia.
          </p>
        )}
        <ul className="space-y-4">
          {comments.map((c) => (
            <li key={c.id} className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center mb-2">
                <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                  {/* Inicial del user_id */}
                  <span className="text-gray-600 font-semibold">
                    {c.user_id.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium">
                    Usuario {c.user_id.substring(0, 6)}...
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(c.created_at).toLocaleString("es-ES", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
              <p className="text-gray-800">{c.text}</p>
            </li>
          ))}
        </ul>

        {/* Botón “Cargar más” */}
        {comments.length % 10 === 0 && comments.length > 0 && (
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setPage(page + 1);
                loadComments(page + 1);
              }}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition"
            >
              Cargar más
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

export default NewsDetail;
