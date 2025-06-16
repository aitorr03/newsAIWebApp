import React, { useState, FormEvent } from "react";

const Home: React.FC = () => {
  const [newsUrl, setNewsUrl] = useState("");
  const [newsText, setNewsText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // Aquí iría la llamada al backend para analizar la noticia...
    setLoading(true);
    // Simulación de carga
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-white">
      {/* Hero + Form en el mismo fondo azul */}
      <section className="w-full bg-blue-100/60 py-16 flex flex-col items-center shadow-sm border-b border-blue-200 animate-fade-in">
        {/* Header */}
        <div className="text-center px-4">
          <h1 className="text-7xl font-extrabold text-blue-700 tracking-tight mb-1 drop-shadow">
            Info<span className="text-blue-400">Sift</span>
          </h1>
          <p className="text-2xl text-gray-700 font-semibold max-w-2xl mx-auto">
            Tu filtro inteligente para detectar{" "}
            <span className="font-bold text-blue-600">fake news</span> en
            segundos.
          </p>
          <p className="text-md text-gray-500 mt-2">
            Analiza noticias y comprueba si son{" "}
            <span className="font-semibold">reales</span> o{" "}
            <span className="font-semibold text-red-500">falsas</span> con IA.
          </p>
          {/* Barra animada centrada */}
          <div className="w-32 h-1 bg-blue-400 rounded-full mt-6 animate-bounce-slow mx-auto" />
        </div>

        {/* Formulario */}
        <form
          onSubmit={handleSubmit}
          className="
            w-full max-w-lg bg-white/80 backdrop-blur-md shadow-xl rounded-2xl border border-blue-100
            px-10 py-12 mt-12 mb-2 flex flex-col gap-6 transition-all
          "
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
          />

          <button
            type="submit"
            disabled={loading}
            className={`
              relative z-10
              w-full mt-4
              bg-blue-700 hover:bg-blue-800
              text-blue-400 font-bold text-lg uppercase
              rounded-xl py-3
              shadow-lg transition-all
              focus:outline-none focus:ring-4 focus:ring-blue-300
              ${loading ? "opacity-50 cursor-not-allowed" : "animate-glow"}
            `}
          >
            {loading ? "Analizando…" : "Enviar Análisis"}
          </button>
        </form>

        <p className="mt-6 text-xs text-blue-400 max-w-xl text-center px-4">
          <span className="font-semibold text-blue-500">Aviso:</span> Esta
          herramienta es experimental y puede contener errores. Los resultados
          no deben considerarse diagnósticos definitivos ni ser la única fuente
          para tomar decisiones importantes.
        </p>
      </section>

      {/* ¿Cómo funciona? */}
      <main className="flex-1 flex flex-col items-center justify-start py-16 px-4">
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

      {/* Animaciones Tailwind */}
      <style>
        {`
          @keyframes bounce-slow {
            0%, 100% { transform: translateY(0); }
            50%      { transform: translateY(-4px); }
          }
          .animate-bounce-slow { animation: bounce-slow 2s infinite; }

          @keyframes glow {
            0%   { box-shadow: 0 0 0 0 #60a5fa33; }
            50%  { box-shadow: 0 0 20px 2px #60a5fa77; }
            100% { box-shadow: 0 0 0 0 #60a5fa33; }
          }
          .animate-glow { animation: glow 2s infinite; }

          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-40px); }
            to   { opacity: 1; transform: none; }
          }
          .animate-fade-in { animation: fadeIn 1s ease; }
        `}
      </style>
    </div>
  );
};

export default Home;
