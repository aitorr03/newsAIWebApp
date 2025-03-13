import requests
import os

HUGGINGFACE_TOKEN = os.getenv("HUGGINGFACE_TOKEN")
SUMMARY_API_URL = "https://api-inference.huggingface.co/models/facebook/bart-large-cnn"


# Modelo para resumen, extracción de título y clasificación de noticias por tipo
def generate_summary(text: str) -> str:
    headers = {"Authorization": f"Bearer {HUGGINGFACE_TOKEN}"}
    payload = {"inputs": text, "options": {"wait_for_model": True}}

    response = requests.post(SUMMARY_API_URL, headers=headers, json=payload)
    response.raise_for_status()  # Para manejar errores HTTP adecuadamente

    result = response.json()

    if isinstance(result, list) and "summary_text" in result[0]:
        return result[0]["summary_text"]
    else:
        raise Exception(f"Error from Hugging Face API: {result}")
