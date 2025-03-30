import nltk
from nltk.tokenize import sent_tokenize

nltk.download("punkt")


def truncate_text(text: str, max_chars: int) -> str:
    """
    Trunca el texto para que no exceda max_chars,
    asegurándose de que se corte al final de una oración.
    Si ninguna oración cabe completa, se fuerza el truncamiento.
    """
    if len(text) <= max_chars:
        return text

    sentences = sent_tokenize(text)
    truncated = ""
    for sentence in sentences:
        # Verificamos si al agregar la siguiente oración se excedería el límite
        if len(truncated) + len(sentence) + (1 if truncated else 0) > max_chars:
            break
        truncated += (" " if truncated else "") + sentence

    # En caso de que ninguna oración entera quepa, forzamos el truncamiento
    if not truncated:
        truncated = text[:max_chars]

    return truncated.strip()
