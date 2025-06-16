// src/pages/NewsPortal.tsx
import React, { useState, useEffect, ChangeEvent } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  ArrowUpIcon,
  ArrowDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/solid";
import { ExclamationCircleIcon } from "@heroicons/react/24/solid";

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  primary_category?: string;
  url?: string;
  date_analyzed?: string; // ISO string
  result?: "Fake" | "Real";
  probability?: number;
  query_count?: number;
}

const ALL_CATEGORIES = [
  "Política",
  "Economía",
  "Deportes",
  "Tecnología",
  "Ciencia",
  "Salud",
  "Cultura y Entretenimiento",
  "Opinión",
  "Medio Ambiente",
  "Educación",
];

const SORT_OPTIONS = [
  { label: "Número de consultas", value: "query_count" },
  { label: "Fecha de análisis", value: "date_analyzed" },
  { label: "Probabilidad", value: "probability" },
  { label: "Resultado", value: "result" },
];

const NewsPortal: React.FC = () => {
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [primaryCategory, setPrimaryCategory] = useState<string>("");
  const [resultFilter, setResultFilter] = useState<"" | "Real" | "Fake">("");
  const [sortBy, setSortBy] = useState<string>("query_count");
  const [sortOrder, setSortOrder] = useState<-1 | 1>(-1);
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(20);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [totalPages, setTotalPages] = useState<number>(1);

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      setError(null);
      try {
        const params: any = {
          sort_by: sortBy,
          sort_order: sortOrder,
          page,
          limit,
        };
        if (primaryCategory) params.primary_category = primaryCategory;
        if (resultFilter) params.result = resultFilter;

        const response = await axios.get<NewsItem[]>(
          "http://127.0.0.1:8000/stats/news",
          { params }
        );

        const data = response.data || [];
        setNewsList(data);
        setHasMore(data.length === limit);

        // Si el backend envía 'X-Total-Count', calibramos páginas
        const totalCount = parseInt(
          response.headers["x-total-count"] || "0",
          10
        );
        if (totalCount) {
          setTotalPages(Math.ceil(totalCount / limit));
        }
      } catch (err: any) {
        console.error("Error al cargar portal de noticias:", err);
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
    fetchNews();
  }, [primaryCategory, resultFilter, sortBy, sortOrder, page, limit]);

  const handleCategoryChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setPrimaryCategory(e.target.value);
    setPage(1);
  };

  const handleResultChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setResultFilter(e.target.value as any);
    setPage(1);
  };

  const handleSortChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value);
    setPage(1);
  };

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === -1 ? 1 : -1));
    setPage(1);
  };

  const prevPage = () => setPage((p) => Math.max(p - 1, 1));
  const nextPage = () => hasMore && setPage((p) => p + 1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl text-blue-700 font-extrabold text-center mb-8">
          Portal de Noticias
        </h1>

        {/* Filtros */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6 shadow-lg mb-8">
          <div>
            <label className="block text-blue-900 font-semibold mb-2">
              Categoría
            </label>
            <select
              value={primaryCategory}
              onChange={handleCategoryChange}
              className="w-full border-b border-blue-200 text-blue-900 py-2 focus:outline-none focus:border-blue-500 transition-all"
            >
              <option value="">Todas</option>
              {ALL_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-blue-900 font-semibold mb-2">
              Resultado
            </label>
            <select
              value={resultFilter}
              onChange={handleResultChange}
              className="w-full border-b border-blue-200 text-blue-900 py-2 focus:outline-none focus:border-blue-500 transition-all"
            >
              <option value="">Todos</option>
              <option value="Real">Real</option>
              <option value="Fake">Fake</option>
            </select>
          </div>

          <div>
            <label className="block text-blue-900 font-semibold mb-2">
              Ordenar por
            </label>
            <div className="flex items-center">
              <select
                value={sortBy}
                onChange={handleSortChange}
                className="flex-1 border-b border-blue-200 text-blue-900 py-2 focus:outline-none focus:border-blue-500 transition-all"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <button
                onClick={toggleSortOrder}
                className="ml-2 p-2 bg-blue-600 rounded-full hover:bg-blue-700 transition"
              >
                {sortOrder === -1 ? (
                  <ArrowDownIcon className="w-5 h-5 text-white" />
                ) : (
                  <ArrowUpIcon className="w-5 h-5 text-white" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Estado */}
        {loading && (
          <p className="text-center text-blue-500">Cargando noticias…</p>
        )}
        {error && <p className="text-center text-red-500">{error}</p>}

        {/* Lista de noticias */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {newsList.map((news) => (
            <div
              key={news.id}
              className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition flex flex-col"
            >
              <h2 className="text-xl font-semibold text-blue-700 mb-2 line-clamp-2">
                {news.title}
              </h2>
              <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                {news.summary}
              </p>

              <div className="mt-auto flex flex-wrap gap-2 mb-4">
                {news.primary_category && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                    {news.primary_category}
                  </span>
                )}
                {news.result && (
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      news.result === "Fake"
                        ? "bg-red-100 text-red-600"
                        : "bg-green-100 text-green-600"
                    }`}
                  >
                    {news.result}
                  </span>
                )}
              </div>

              <Link
                to={`/news/${news.id}`}
                className="text-blue-600 hover:underline font-semibold mt-2"
              >
                Ver detalle →
              </Link>
            </div>
          ))}
        </div>

        {/* Paginación */}
        <div className="flex items-center justify-center space-x-4 mt-8">
          <button
            onClick={prevPage}
            disabled={page === 1}
            className={`px-4 py-2 rounded-lg transition ${
              page === 1
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            Anterior
          </button>
          <span className="text-blue-700 font-medium">
            Página {page} de {totalPages}
          </span>
          <button
            onClick={nextPage}
            disabled={!hasMore}
            className={`px-4 py-2 rounded-lg transition ${
              !hasMore
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewsPortal;
