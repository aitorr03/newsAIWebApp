import React, { useState, FormEvent } from "react";
import Header from "./Header";

const HomePageContent: React.FC = () => {
  const [newsUrl, setNewsUrl] = useState<string>("");
  const [newsText, setNewsText] = useState<string>("");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Analizando:", { newsUrl, newsText });
  };

  return (
    // Container principal que ocupa toda la pantalla y empuja el contenido hacia abajo (pt-40)
    <div className=" flex items-start justify-center ">
      <Header />
      {/* Contenedor interno para centrar horizontalmente */}
      <div className=" bg-gray-100 w-full max-w-2xl mx-auto px-4 pt-10 mt-75 border rounded-lg shadow-md hover:scale-105 transition-transform duration-300">
        {/* Título principal de la página */}
        <h1 className="text-4xl font-bold text-center text-primary-dark mb-4">
          Analiza una noticia
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Ingresa la URL y el contenido de la noticia para verificar si es real
          o falsa.
        </p>
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow">
          <div className="mb-4">
            <label
              htmlFor="newsUrl"
              className="block text-lg font-medium text-gray-700 mb-2"
            >
              URL de la noticia
            </label>
            <input
              type="url"
              id="newsUrl"
              placeholder="https://ejemplo.com/noticia"
              value={newsUrl}
              onChange={(e) => setNewsUrl(e.target.value)}
              required
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-light"
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="newsText"
              className="block text-lg font-medium text-gray-700 mb-2"
            >
              Contenido de la noticia
            </label>
            <textarea
              id="newsText"
              rows={6}
              placeholder="Pega aquí el contenido de la noticia..."
              value={newsText}
              onChange={(e) => setNewsText(e.target.value)}
              required
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-light"
            ></textarea>
          </div>
          <div className="flex justify-center">
            <button
              type="submit"
              className="bg-primary-light text-white px-6 py-3 rounded text-xl font-semibold hover:bg-primary-dark transition-colors"
            >
              Analizar
            </button>
          </div>
        </form>
        <div className="mt-8 text-center">
          <p className="text-gray-500 pb-10">
            Una vez enviado, el análisis tardará unos segundos. Por favor,
            espera y te mostraremos el resultado.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomePageContent;
