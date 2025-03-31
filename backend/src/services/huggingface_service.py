import os
import requests
from backend.src.database.models.news import NewsCategory
from backend.src.services.news_service import truncate_text, es_truncate_text
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM, pipeline

# Token de HuggingFace
HUGGINGFACE_TOKEN = os.getenv("HUGGINGFACE_TOKEN")

# Modelo de resumen y generación de título en español (local)
model_name = "mrm8488/bert2bert_shared-spanish-finetuned-summarization"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSeq2SeqLM.from_pretrained(model_name)

# Modelo de resumen y generación de título en otros idiomas (consumo de API)
EN_SUMMARY_API_URL = (
    "https://api-inference.huggingface.co/models/facebook/bart-large-cnn"
)
EN_CLASSIFICATION_API_URL = (
    "https://api-inference.huggingface.co/models/facebook/bart-large-mnli"
)

# Posibles etiquetas en español (valores)
ES_CANDIDATE_LABELS = [category.value for category in NewsCategory]

# Para inglés, usaremos las keys, puesto que están en inglés
EN_CANDIDATE_LABELS = [category.name for category in NewsCategory]

# Pipeline para detección de idioma
language_detector = pipeline(
    "text-classification",
    model="papluca/xlm-roberta-base-language-detection",
    return_all_scores=True,
)


# Detección de idioma
def detect_language(text: str) -> str:
    results = language_detector(text)
    best = max(results[0], key=lambda x: x["score"])
    return best["label"]


def es_generate_summary_and_title(text: str, max_length: int, min_length: int) -> str:
    inputs = tokenizer.encode(text, return_tensors="pt", truncation=True)
    summary_ids = model.generate(
        inputs,
        max_length=max_length,
        min_length=min_length,
        length_penalty=2.0,
        num_beams=4,
        early_stopping=True,
    )
    return es_truncate_text(
        tokenizer.decode(summary_ids[0], skip_special_tokens=True), 500
    )


def en_generate_summary_and_title(text: str, max_length: int, min_length: int) -> str:

    if max_length < 100:
        text = (
            "Summarize the main event of this news article in a concise title: " + text
        )
    else:
        text = "Summarize this news article: " + text

    headers = {"Authorization": f"Bearer {HUGGINGFACE_TOKEN}"}
    payload = {
        "inputs": text,
        "parameters": {
            "max_length": max_length,
            "min_length": min_length,
            "temperature": 0.9,
            "top_k": 75,
            "top_p": 0.95,
            "length_penalty": 2.0,
            "num_beams": 4,
            "early_stopping": True,
        },
        "options": {"wait_for_model": True},
    }
    response = requests.post(EN_SUMMARY_API_URL, headers=headers, json=payload)
    response.raise_for_status()
    result = response.json()
    if isinstance(result, list) and "summary_text" in result[0]:
        text = result[0]["summary_text"].strip()
        return truncate_text(text, max_length)
    else:
        raise Exception(f"Error from Hugging Face API (EN summary): {result}")


# --- Clasificación ---
# Pipeline para clasificación en español (local)
spanish_classifier = pipeline(
    "zero-shot-classification",
    model="MoritzLaurer/mDeBERTa-v3-base-mnli-xnli",
    tokenizer="MoritzLaurer/mDeBERTa-v3-base-mnli-xnli",
)


def es_classify_news_type(text: str) -> str:
    hypothesis_template = "Este artículo es sobre {}."
    result = spanish_classifier(
        text,
        candidate_labels=ES_CANDIDATE_LABELS,
        hypothesis_template=hypothesis_template,
    )
    predicted_label = result["labels"][0]
    return predicted_label


def en_classify_news_type(text: str) -> dict:
    headers = {"Authorization": f"Bearer {HUGGINGFACE_TOKEN}"}
    payload = {
        "inputs": text,
        "parameters": {
            "candidate_labels": EN_CANDIDATE_LABELS,
            "hypothesis_template": "This news article is about {}.",
        },
        "options": {"wait_for_model": True},
    }

    response = requests.post(EN_CLASSIFICATION_API_URL, headers=headers, json=payload)
    response.raise_for_status()
    result = response.json()

    labels = result.get("labels", [])
    scores = result.get("scores", [])

    if not labels or not scores:
        raise Exception("No se obtuvieron etiquetas de la API de clasificación")

    primary_label_key = labels[0]
    primary_score = scores[0]

    secondary_label_key = None

    if len(labels) > 1:

        secondary_label_key = labels[1]
        secondary_score = scores[1]

        # Aplicamos criterios: la score de la segunda debe ser al menos 0.225
        # y la diferencia con la primaria no mayor a 0.075

        if secondary_score < 0.225 or (primary_score - secondary_score) > 0.075:
            secondary_label_key = None  # No cumple criterio

    mapping = {category.name: category for category in NewsCategory}

    primary_category = mapping.get(primary_label_key)

    if secondary_label_key is not None:
        secondary_category = mapping.get(secondary_label_key)
    else:
        secondary_category = None

    return {"primary": primary_category, "secondary": secondary_category}


es_title_model_name = "LeoCordoba/mt5-small-cc-news-es-titles"
es_title_tokenizer = AutoTokenizer.from_pretrained(es_title_model_name)
es_title_model = AutoModelForSeq2SeqLM.from_pretrained(es_title_model_name)


def es_generate_title(text: str, max_length: int, min_length: int) -> str:
    inputs = es_title_tokenizer.encode(text, return_tensors="pt", truncation=True)
    title_ids = es_title_model.generate(
        inputs,
        max_length=max_length,
        min_length=min_length,
        length_penalty=2.0,
        num_beams=4,
        early_stopping=True,
    )
    generated_title = es_title_tokenizer.decode(
        title_ids[0], skip_special_tokens=True
    ).strip()
    return es_truncate_text(generated_title, max_length)


def en_generate_title(text: str, max_length: int, min_length: int) -> str:

    prompt = (
        "Generate a concise and informative title for the following news article: "
        + text
    )
    inputs = es_title_tokenizer.encode(prompt, return_tensors="pt", truncation=True)
    title_ids = es_title_model.generate(
        inputs,
        max_length=max_length,
        min_length=min_length,
        length_penalty=2.0,
        num_beams=4,
        early_stopping=True,
    )
    generated_title = es_title_tokenizer.decode(
        title_ids[0], skip_special_tokens=True
    ).strip()
    return truncate_text(generated_title, max_length)


def analyze_news(text: str) -> dict:
    language = detect_language(text)

    if language == "es":
        summary = es_generate_summary_and_title(text, max_length=500, min_length=125)
        title = es_generate_title(text, max_length=125, min_length=10)
        news_type = es_classify_news_type(text)
        return {
            "language": language,
            "summary": summary,
            "title": title,
            "type": {"primary": news_type, "secondary": None},
        }
    else:
        summary = en_generate_summary_and_title(text, max_length=500, min_length=125)
        title = en_generate_title(text, max_length=125, min_length=10)
        news_type = en_classify_news_type(text)
        return {
            "language": language,
            "summary": summary,
            "title": title,
            "type": news_type,
        }
