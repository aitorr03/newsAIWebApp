from typing import Optional, Dict
from urllib.parse import urlparse

from bson import ObjectId
from pydantic import TypeAdapter, AnyUrl
from backend.src.services.classification_service import (
    predict_fake_news,
    detect_language,
)
from backend.src.services.ollama_service import translate_to_english, analyze_news
from backend.src.client import db_client
from backend.src.database.models.news import News
from backend.src.database.models.analysis import Analysis


class NewsManagerService:
    @staticmethod
    def create_or_update(url: str, text: str, current_user: Optional[dict]) -> Dict:

        # Clasificación
        language = detect_language(text)
        english_text = text if language == "en" else translate_to_english(text)
        classification = predict_fake_news(english_text)

        source, url_any = NewsManagerService._normalize_url(url)
        prediction, probability = (
            classification["prediction"],
            classification["probability"],
        )

        # Comprobar si el registro existe
        existing = db_client.local.news.find_one({"url": url})
        if existing:
            return NewsManagerService._update_existing(
                existing, prediction, probability, current_user
            )

        # Análisis de Ollama
        analysis_data = analyze_news(english_text)
        return NewsManagerService._create_new(
            url, url_any, source, analysis_data, prediction, probability, current_user
        )

    @staticmethod
    def _normalize_url(url: str) -> (str, AnyUrl):
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
        try:
            updates = {}
            if probability > existing.get("probability", 0):
                updates.update({"result": prediction, "probability": probability})
            updates["query_count"] = existing.get("query_count", 0) + 1
            db_client.local.news.update_one({"_id": existing["_id"]}, {"$set": updates})

            if current_user:
                NewsManagerService._log_analysis(
                    current_user.get("_id"),
                    existing.get("_id"),
                    prediction,
                )

            return {
                "message": "News already exists, updated query count",
                "news_id": str(existing["_id"]),
                "query_count": updates["query_count"],
            }
        except Exception as e:
            print(f"Error en _update_existing: {e}")
            raise Exception(f"Error al actualizar la noticia existente: {e}")

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
        try:
            secondary = analysis_data.get("secondary_category")
            if isinstance(secondary, str) and secondary.lower() in {"none", "null"}:
                secondary = None

            news_model = News(
                title=analysis_data["title"],
                summary=analysis_data["summary"],
                primary_category=analysis_data["primary_category"],
                secondary_category=secondary,
                url=url_any,
                source=source,
                result=prediction,
                probability=probability,
            )
            doc = news_model.model_dump(exclude={"id"})
            doc["url"] = url

            insert_result = db_client.local.news.insert_one(doc)
            if not insert_result.acknowledged or not insert_result.inserted_id:
                raise Exception("No se pudo insertar la noticia en la base de datos")

            if current_user:
                NewsManagerService._log_analysis(
                    current_user.get("_id"),
                    insert_result.inserted_id,
                    prediction,
                )

            return {
                "message": "News created successfully",
                "news_id": str(insert_result.inserted_id),
            }

        except Exception as e:
            print(f"Error en _create_new: {e}")
            raise Exception(f"Error al crear la noticia: {e}")

    @staticmethod
    def _log_analysis(
        new_user_id: ObjectId, new_news_id: ObjectId, result: str
    ) -> None:
        analysis = Analysis(
            user_id=ObjectId(new_user_id), news_id=ObjectId(new_news_id), result=result
        )
        db_client.local.analysis.insert_one(analysis.model_dump(exclude={"id"}))
