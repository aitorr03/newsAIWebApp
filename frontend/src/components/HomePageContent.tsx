import React, { useState, FormEvent, ChangeEvent } from "react";

const HomePageContent: React.FC = () => {
  const [newsUrl, setNewsUrl] = useState<string>("");
  const [newsText, setNewsText] = useState<string>("");

  // Tipamos el evento de envío como FormEvent<HTMLFormElement>
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Analizando:", { newsUrl, newsText });
    // Aquí puedes llamar a tu API utilizando axios o fetch.
  };

  const handleUrlChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNewsUrl(e.target.value);
  };

  const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setNewsText(e.target.value);
  };

  return (
    <div className="container mx-auto my-8 px-4">
      {/* Título e instrucciones */}
      <h1 className="text-4xl font-bold text-center text-primary-dark mb-4">
        Analiza una noticia
      </h1>
      <p className="text-center text-gray-600 mb-8">
        Ingresa la URL y el contenido de la noticia para verificar si es real o
        falsa.
      </p>

      {/* Formulario de análisis */}
      <form
        onSubmit={handleSubmit}
        className="max-w-2xl mx-auto bg-white p-6 rounded shadow"
      >
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
            onChange={handleUrlChange}
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
            rows={6} // Usamos rows={6} para indicar un valor numérico
            placeholder="Pega aquí el contenido de la noticia..."
            value={newsText}
            onChange={handleTextChange}
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

      {/* Información adicional */}
      <div className="mt-8 text-center">
        <p className="text-gray-500">
          Una vez enviado, el análisis tardará unos segundos. Por favor, espera
          y te mostraremos el resultado.
        </p>
      </div>
    </div>
  );
};

export default HomePageContent;
