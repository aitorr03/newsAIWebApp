from typing import Optional, Dict, Tuple
from urllib.parse import urlparse
from datetime import datetime, timezone

from bson import ObjectId
from pydantic import TypeAdapter, AnyUrl

from backend.src.services.classification_service import (
    predict_fake_news,
    detect_language,
)
from backend.src.services.ollama_service import translate_to_english, analyze_news
from backend.src.client import db_client
from backend.src.database.models.analysis import Analysis
from backend.src.database.schemas.news_schema import news_schema


class NewsManagerService:
    @staticmethod
    def create_or_update(url: str, text: str, current_user: Optional[dict]) -> Dict:
        # 1) Detectar idioma y traducir si hace falta
        language = detect_language(text)
        english_text = text if language == "en" else translate_to_english(text)

        # 2) Clasificación real/fake
        classification = predict_fake_news(english_text)
        prediction, probability = (
            classification["prediction"],
            classification["probability"],
        )

        # 3) Normalizar URL
        source, url_any = NewsManagerService._normalize_url(url)

        # 4) ¿Ya existe?
        existing = db_client.local.news.find_one({"url": url})
        if existing:
            return NewsManagerService._update_existing(
                existing, prediction, probability, current_user
            )

        # 5) Extraer título, resumen y categorías con Ollama
        analysis_data = analyze_news(english_text)

        # 6) Crear nuevo
        return NewsManagerService._create_new(
            url, url_any, source, analysis_data, prediction, probability, current_user
        )

    @staticmethod
    def _normalize_url(url: str) -> Tuple[str, AnyUrl]:
        source = urlparse(url).netloc
        adapter = TypeAdapter(AnyUrl)
        return source, adapter.validate_python(url)

    @staticmethod
    def _update_existing(
        existing: dict,
        prediction: str,
        probability: float,
        current_user: Optional[dict],
    ) -> Dict:
        # Incrementar contador y, si mejora probabilidad, actualizar resultado
        updates: Dict = {"query_count": existing.get("query_count", 0) + 1}
        if probability > existing.get("probability", 0):
            updates.update({"result": prediction, "probability": probability})

        db_client.local.news.update_one({"_id": existing["_id"]}, {"$set": updates})

        # Registrar en historial si hay usuario
        if current_user:
            NewsManagerService._log_analysis(
                current_user.get("_id"), existing["_id"], prediction
            )

        # Recuperar y serializar la noticia actualizada
        updated = db_client.local.news.find_one({"_id": existing["_id"]})
        return news_schema(updated)

    @staticmethod
    def _create_new(
        url: str,
        url_any: AnyUrl,
        source: str,
        analysis_data: dict,
        prediction: str,
        probability: float,
        current_user: Optional[dict],
    ) -> Dict:
        # Limpiar categoría secundaria
        secondary = analysis_data.get("secondary_category")
        if isinstance(secondary, str) and secondary.lower() in {"none", "null"}:
            secondary = None

        # Hora de análisis
        now = datetime.now(timezone.utc)

        # Construir documento Mongo
        doc = {
            "title": analysis_data["title"],
            "summary": analysis_data["summary"],
            "primary_category": analysis_data["primary_category"],
            "secondary_category": secondary,
            "url": url,
            "source": source,
            "result": prediction,
            "probability": probability,
            "query_count": 1,
            "date_analyzed": now,  # <-- lo añadimos aquí
        }

        insert_result = db_client.local.news.insert_one(doc)
        if not insert_result.acknowledged:
            raise Exception("No se pudo insertar la noticia en la base de datos")

        # Registrar en historial
        if current_user:
            NewsManagerService._log_analysis(
                current_user.get("_id"), insert_result.inserted_id, prediction
            )

        # Recuperar y serializar el documento completo
        created = db_client.local.news.find_one({"_id": insert_result.inserted_id})
        return news_schema(created)

    @staticmethod
    def _log_analysis(
        new_user_id: ObjectId, new_news_id: ObjectId, result: str
    ) -> None:
        entry = Analysis(
            user_id=ObjectId(new_user_id),
            news_id=ObjectId(new_news_id),
            result=result,
        )
        db_client.local.analysis.insert_one(entry.model_dump(exclude={"id"}))
