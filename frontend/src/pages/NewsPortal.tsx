// src/pages/NewsPortal.tsx
import React, { useState, useEffect, ChangeEvent } from "react";
import { axiosClient } from "../services/axiosClient";
import { useNavigate } from "react-router-dom";
import {
  ArrowUpIcon,
  ArrowDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/solid";

interface NewsItem {
  _id?: string;
  id?: string;
  title: string;
  summary: string;
  primary_category?: string;
  secondary_category?: string;
  date_analyzed?: string;
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

// Componente de indicador circular
const CircularProgress: React.FC<{ percent: number; color: string }> = ({
  percent,
  color,
}) => {
  const radius = 40;
  const stroke = 8;
  const r = radius - stroke * 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <svg
      height={radius * 2}
      width={radius * 2}
      className="absolute right-8 bottom-6"
    >
      {/* Fondo gris */}
      <circle
        stroke="#e5e7eb"
        fill="transparent"
        strokeWidth={stroke}
        r={r}
        cx={radius}
        cy={radius}
      />
      {/* Progreso coloreado, rotado para arrancar arriba */}
      <circle
        stroke={color}
        fill="transparent"
        strokeWidth={stroke}
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={offset}
        strokeLinecap="round"
        r={r}
        cx={radius}
        cy={radius}
        style={{
          transform: "rotate(-90deg)",
          transformOrigin: `${radius}px ${radius}px`,
          transition: "stroke-dashoffset 0.35s",
        }}
      />
      {/* Texto centrado */}
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dy=".3em"
        className="text-lg fill-current text-gray-700 font-semibold"
      >
        {percent.toFixed(0)}%
      </text>
    </svg>
  );
};

const NewsPortal: React.FC = () => {
  const navigate = useNavigate();
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [primaryCategory, setPrimaryCategory] = useState<string>("");
  const [resultFilter, setResultFilter] = useState<"" | "Real" | "Fake">("");
  const [sortBy, setSortBy] = useState<string>("query_count");
  const [sortOrder, setSortOrder] = useState<-1 | 1>(-1);
  const [page, setPage] = useState<number>(1);
  const limit = 20;
  const [hasMore, setHasMore] = useState(true);
  const [totalPages, setTotalPages] = useState(1);

  const prevPage = () => setPage((p) => Math.max(p - 1, 1));
  const nextPage = () => hasMore && setPage((p) => p + 1);

  const goToDetail = (n: NewsItem) => {
    const id = n.id ?? n._id;
    if (id) navigate(`/news/${id}`);
  };

  useEffect(() => {
    (async () => {
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

        const res = await axiosClient.get<NewsItem[]>("/api/stats/news", {
          params,
        });
        setNewsList(res.data || []);
        setHasMore((res.data?.length || 0) === limit);
        const total = parseInt(res.headers["x-total-count"] || "0", 10);
        if (total) setTotalPages(Math.ceil(total / limit));
      } catch (e: any) {
        setError(e.response?.data?.detail || e.message || "Error inesperado");
      } finally {
        setLoading(false);
      }
    })();
  }, [primaryCategory, resultFilter, sortBy, sortOrder, page]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl text-blue-700 font-extrabold text-center mb-8">
          Portal de Noticias
        </h1>

        {/* Filtros */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6 shadow-lg mb-8">
          {/* Categoría */}
          <div>
            <label className="block text-blue-900 font-semibold mb-2">
              Categoría
            </label>
            <select
              value={primaryCategory}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                setPrimaryCategory(e.target.value);
                setPage(1);
              }}
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

          {/* Resultado */}
          <div>
            <label className="block text-blue-900 font-semibold mb-2">
              Resultado
            </label>
            <select
              value={resultFilter}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                setResultFilter(e.target.value as any);
                setPage(1);
              }}
              className="w-full border-b border-blue-200 text-blue-900 py-2 focus:outline-none focus:border-blue-500 transition-all"
            >
              <option value="">Todos</option>
              <option value="Real">Real</option>
              <option value="Fake">Fake</option>
            </select>
          </div>

          {/* Orden */}
          <div>
            <label className="block text-blue-900 font-semibold mb-2">
              Ordenar por
            </label>
            <div className="flex items-center">
              <select
                value={sortBy}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
                className="flex-1 border-b border-blue-200 text-blue-900 py-2 focus:outline-none focus:border-blue-500 transition-all"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  setSortOrder((prev) => (prev === -1 ? 1 : -1));
                  setPage(1);
                }}
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
        {loading && <p className="text-center text-blue-500">Cargando…</p>}
        {error && <p className="text-center text-red-500">{error}</p>}

        {/* Lista de noticias */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {newsList.map((n) => {
            const pct = (n.probability ?? 0) * 100;
            return (
              <div
                key={n.id ?? n._id}
                className="relative bg-white rounded-2xl shadow-md p-6 flex flex-col hover:shadow-lg transition"
                style={{ paddingBottom: "3rem" }}
              >
                <h2 className="text-xl font-semibold text-blue-700 mb-2 line-clamp-2">
                  {n.title}
                </h2>
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                  {n.summary}
                </p>
                <div className="mt-auto flex flex-wrap gap-2 items-center mb-8">
                  {n.primary_category && (
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                      {n.primary_category}
                    </span>
                  )}
                  {n.secondary_category && (
                    <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">
                      {n.secondary_category}
                    </span>
                  )}
                  {n.result && (
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        n.result === "Fake"
                          ? "bg-red-100 text-red-600"
                          : "bg-green-100 text-green-600"
                      }`}
                    >
                      {n.result}
                    </span>
                  )}
                </div>

                <CircularProgress
                  percent={pct}
                  color={n.result === "Fake" ? "#ef4444" : "#10b981"}
                />

                <button
                  onClick={() => goToDetail(n)}
                  className="mt-2 self-start text-blue-600 hover:underline font-semibold"
                >
                  Ver detalle →
                </button>
              </div>
            );
          })}
        </div>

        {/* Paginación */}
        <div className="flex items-center justify-center space-x-4 mt-8">
          <button
            onClick={prevPage}
            disabled={page === 1}
            className={`px-4 py-2 rounded-lg ${
              page === 1
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            <ChevronLeftIcon className="w-4 h-4 inline-block" /> Anterior
          </button>
          <span className="text-blue-700 font-medium">
            Página {page} de {totalPages}
          </span>
          <button
            onClick={nextPage}
            disabled={!hasMore}
            className={`px-4 py-2 rounded-lg ${
              !hasMore
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            Siguiente <ChevronRightIcon className="w-4 h-4 inline-block" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewsPortal;
