// src/pages/Analyze.tsx
import React, { useState, FormEvent } from "react";
import axios from "axios";

interface NewsResult {
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

const Analyze: React.FC = () => {
  const [newsUrl, setNewsUrl] = useState<string>("");
  const [newsText, setNewsText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [resultData, setResultData] = useState<NewsResult | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setResultData(null);

    if (!newsUrl.trim() && !newsText.trim()) {
      setError("Debes ingresar una URL o pegar el contenido de la noticia.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        url: newsUrl.trim() || null,
        news: newsText.trim() || null,
      };

      const response = await axios.post<NewsResult>(
        "http://127.0.0.1:8000/news/",
        payload,
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      setResultData(response.data);
    } catch (err: any) {
      console.error("Error en la petición:", err);
      setError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Error al analizar la noticia"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-20 flex justify-center px-4">
      <div className="w-full max-w-2xl bg-gray-800 rounded-2xl shadow-xl overflow-hidden relative">
        {/* Spinner overlay */}
        {loading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
            <div className="flex flex-col items-center">
              <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
              <span className="mt-4 text-white">Generando análisis...</span>
            </div>
          </div>
        )}

        {/* Encabezado */}
        <div className="bg-gray-700 py-6 px-6">
          <h1 className="text-3xl font-extrabold text-center text-white">
            Analiza una Noticia
          </h1>
          <p className="mt-2 text-center text-gray-300">
            Ingresa la URL o pega el contenido para verificar si es real o falsa
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="px-6 py-8 bg-gray-800">
          {error && <p className="mb-4 text-center text-red-500">{error}</p>}

          {/* URL de la noticia */}
          <div className="mb-6">
            <label
              htmlFor="newsUrl"
              className="block text-sm font-medium text-gray-200 mb-2"
            >
              URL de la noticia (opcional)
            </label>
            <input
              type="url"
              id="newsUrl"
              placeholder="https://ejemplo.com/noticia"
              value={newsUrl}
              onChange={(e) => setNewsUrl(e.target.value)}
              className="
                block w-full bg-gray-700 border border-gray-600 rounded-lg
                px-4 py-3 text-gray-100 placeholder-gray-400
                focus:outline-none focus:ring-2 focus:ring-blue-500
                transition-colors duration-200
              "
            />
          </div>

          {/* Contenido de la noticia */}
          <div className="mb-6">
            <label
              htmlFor="newsText"
              className="block text-sm font-medium text-gray-200 mb-2"
            >
              Contenido de la noticia (opcional)
            </label>
            <textarea
              id="newsText"
              rows={5}
              placeholder="Pega aquí el contenido de la noticia..."
              value={newsText}
              onChange={(e) => setNewsText(e.target.value)}
              className="
                block w-full bg-gray-700 border border-gray-600 rounded-lg
                px-4 py-3 text-gray-100 placeholder-gray-400
                focus:outline-none focus:ring-2 focus:ring-blue-500
                transition-colors duration-200
                resize-none
              "
            ></textarea>
          </div>

          {/* Botón de enviar */}
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={loading}
              className={`
                w-full md:w-auto bg-blue-600 hover:bg-blue-700
                text-gray-100 font-semibold text-lg rounded-lg
                px-8 py-3 shadow-md transition-colors duration-200
                focus:outline-none focus:ring-2 focus:ring-blue-400
                ${loading ? "opacity-50 cursor-not-allowed" : ""}
              `}
            >
              {loading ? "Analizando..." : "Analizar"}
            </button>
          </div>

          {/* Texto informativo */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              Puedes usar URL o pegar el contenido directamente. Si envías
              ambos, se priorizará la URL. Una vez enviado, el análisis toma
              unos segundos.
            </p>
          </div>
        </form>
      </div>

      {/* Modal de resultados */}
      {resultData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 md:mx-0 overflow-hidden">
            <div className="flex justify-between items-center bg-blue-600 px-6 py-4">
              <h2 className="text-xl font-semibold text-white">
                Resultado del Análisis
              </h2>
              <button
                className="text-white text-2xl leading-none"
                onClick={() => setResultData(null)}
              >
                &times;
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p>
                <span className="font-medium">Título generado:</span>{" "}
                {resultData.title}
              </p>
              <p>
                <span className="font-medium">Resumen:</span>{" "}
                {resultData.summary}
              </p>
              <p>
                <span className="font-medium">Categoría:</span>{" "}
                <span className="capitalize">
                  {resultData.primary_category}
                </span>
              </p>
              <p>
                <span className="font-medium">Resultado ML:</span>{" "}
                {resultData.result === "Fake" ? (
                  <span className="text-red-600">Falsa</span>
                ) : (
                  <span className="text-green-600">Real</span>
                )}{" "}
                ({(resultData.probability * 100).toFixed(1)}%)
              </p>
              <p>
                <span className="font-medium">Analizada el:</span>{" "}
                {new Date(resultData.date_analyzed).toLocaleString("es-ES", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              <div className="pt-4 text-right">
                <button
                  onClick={() => setResultData(null)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analyze;
