import requests
import os
from backend.src.database.models.news import NewsCategory, get_news_category

HUGGINGFACE_TOKEN = os.getenv("HUGGINGFACE_TOKEN")

SUMMARY_API_URL = "https://api-inference.huggingface.co/models/facebook/bart-large-cnn"

ZERO_SHOT_API_URL = (
    "https://api-inference.huggingface.co/models/facebook/bart-large-mnli"
)

# Lista de categorías posibles
CANDIDATE_LABELS = [
    "politics",
    "economy",
    "sports",
    "technology",
    "science",
    "health",
    "culture",
    "international",
    "events",
    "opinion",
    "environment",
    "education",
    "business",
]


def generate_summary(text: str) -> str:

    # Petición POST a la API de HuggingFace para generar resumen

    headers = {"Authorization": f"Bearer {HUGGINGFACE_TOKEN}"}
    payload = {"inputs": text, "options": {"wait_for_model": True}}

    response = requests.post(SUMMARY_API_URL, headers=headers, json=payload)
    response.raise_for_status()  # Maneja errores HTTP
    result = response.json()

    if isinstance(result, list) and "summary_text" in result[0]:
        return result[0]["summary_text"]
    else:
        raise Exception(f"Error from Hugging Face API (summary): {result}")


def generate_title(text: str) -> str:

    # Petición POST a la API de HuggingFace para generar título

    headers = {"Authorization": f"Bearer {HUGGINGFACE_TOKEN}"}

    payload = {
        "inputs": text,
        "parameters": {"max_length": 30, "min_length": 10},
        "options": {"wait_for_model": True},
    }

    response = requests.post(SUMMARY_API_URL, headers=headers, json=payload)
    response.raise_for_status()
    result = response.json()

    if isinstance(result, list) and "summary_text" in result[0]:
        return result[0]["summary_text"]
    else:
        raise Exception(f"Error from Hugging Face API (title): {result}")


def classify_news_type(text: str) -> NewsCategory:
    headers = {"Authorization": f"Bearer {HUGGINGFACE_TOKEN}"}
    payload = {
        "inputs": text,
        "parameters": {"candidate_labels": CANDIDATE_LABELS},
        "options": {"wait_for_model": True},
    }
    response = requests.post(ZERO_SHOT_API_URL, headers=headers, json=payload)
    result = response.json()

    predicted_key = result["labels"][0]
    category: NewsCategory = get_news_category(predicted_key)
    return category


def analyze_news(text: str) -> dict:

    summary = generate_summary(text)  # Genera resumen del texto
    title = generate_title(text)  # Genera título del texto
    news_type = classify_news_type(text)  # Clasifica el tipo de noticia

    return {"summary": summary, "title": title, "type": news_type}
