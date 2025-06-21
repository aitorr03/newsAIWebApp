// src/pages/Home.tsx
import React, { useState, FormEvent } from "react";

interface NewsResponse {
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

const Home: React.FC = () => {
  const [newsUrl, setNewsUrl] = useState("");
  const [newsText, setNewsText] = useState("");
  const [loading, setLoading] = useState(false);
  const [news, setNews] = useState<NewsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setNews(null);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch("/news/", {
        method: "POST",
        headers,
        body: JSON.stringify({ url: newsUrl, news: newsText }),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || res.statusText);
      }

      const data: NewsResponse = await res.json();
      setNews(data);
    } catch (err: any) {
      setError(err.message || "Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-white overflow-hidden">
      {/* Overlay semitransparente mientras carga */}
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-50 backdrop-blur-sm z-10 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600" />
        </div>
      )}

      <section className="w-full bg-blue-100/60 py-16 flex flex-col items-center shadow-sm border-b border-blue-200 animate-fade-in z-0">
        <div className="text-center px-4">
          <h1 className="text-7xl font-extrabold text-blue-700 tracking-tight mb-1 drop-shadow">
            Info<span className="text-blue-400">Sift</span>
          </h1>
          <p className="text-2xl text-gray-700 font-semibold max-w-2xl mx-auto">
            Tu filtro inteligente para detectar{" "}
            <span className="font-bold text-blue-600">fake news</span> en
            segundos.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="w-full max-w-lg bg-white/80 backdrop-blur-md shadow-xl rounded-2xl border border-blue-100 px-10 py-12 mt-12 mb-2 flex flex-col gap-6 transition-all z-0"
        >
          <label
            htmlFor="news-url"
            className="text-sm text-blue-900 font-semibold"
          >
            URL de la noticia
          </label>
          <input
            id="news-url"
            type="url"
            placeholder="https://ejemplo.com/noticia"
            value={newsUrl}
            onChange={(e) => setNewsUrl(e.target.value)}
            className="w-full border-b border-blue-200 bg-transparent text-blue-900 placeholder-blue-400 py-2 focus:outline-none focus:border-blue-500 transition-all"
            required
          />

          <label
            htmlFor="news-text"
            className="text-sm text-blue-900 font-semibold"
          >
            Contenido de la noticia
          </label>
          <textarea
            id="news-text"
            rows={5}
            placeholder="Pega aquí el contenido completo de la noticia…"
            value={newsText}
            onChange={(e) => setNewsText(e.target.value)}
            className="w-full border-b border-blue-200 bg-transparent text-blue-900 placeholder-blue-400 py-2 resize-none focus:outline-none focus:border-blue-500 transition-all"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className={`relative z-0 w-full mt-4 bg-blue-700 hover:bg-blue-800 text-white font-bold text-lg uppercase rounded-xl py-3 shadow-lg transition-all focus:outline-none focus:ring-4 focus:ring-blue-300 ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Analizando…" : "Enviar Análisis"}
          </button>

          {error && <p className="text-red-600 text-center mt-2">{error}</p>}
        </form>

        {/* Mostrar el resultado */}
        {news && (
          <article className="mt-6 max-w-3xl bg-white rounded-2xl shadow-lg p-6 animate-fade-in">
            <h2 className="text-2xl font-extrabold text-blue-800 mb-2">
              {news.title}
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              <em>
                {new Date(news.date_analyzed || "").toLocaleString("es-ES")}
              </em>{" "}
              • <strong>{news.source}</strong>
            </p>
            <p className="text-gray-700 mb-4">{news.summary}</p>
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                {news.primary_category}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-sm ${
                  news.result === "Real"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {news.result} ({(news.probability! * 100).toFixed(1)}%)
              </span>
            </div>
            {news.url && (
              <a
                href={news.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block text-blue-600 hover:underline"
              >
                Ver noticia original
              </a>
            )}
          </article>
        )}
      </section>

      <main className="flex-1 flex flex-col items-center justify-start py-16 px-4 z-0">
        <h3 className="text-blue-700 text-xl font-semibold mb-4">
          ¿Cómo funciona InfoSift?
        </h3>
        <div className="flex flex-wrap gap-8 justify-center text-blue-600">
          <div className="flex flex-col items-center w-40">
            <span className="text-4xl mb-2">🔍</span>
            <p className="text-md font-medium text-center">
              Analiza noticias en segundos
            </p>
          </div>
          <div className="flex flex-col items-center w-40">
            <span className="text-4xl mb-2">🤖</span>
            <p className="text-md font-medium text-center">
              IA avanzada de clasificación
            </p>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: none; }
        }
        .animate-fade-in { animation: fadeIn 0.5s ease forwards; }
      `}</style>
    </div>
  );
};

export default Home;
