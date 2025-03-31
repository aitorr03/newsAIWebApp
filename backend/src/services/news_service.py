import nltk
from nltk.tokenize import sent_tokenize

nltk.download("punkt_tab")


def truncate_text(text: str, max_chars: int) -> str:

    if len(text) <= max_chars:
        return text

    sentences = sent_tokenize(text)
    truncated = ""
    for sentence in sentences:
        # Verificamos si al agregar la siguiente frase se excede el límite.
        if len(truncated) + len(sentence) + (1 if truncated else 0) > max_chars:
            break
        truncated += (" " if truncated else "") + sentence

    # En caso de que ninguna frase entera quepa, forzamos el truncamiento.
    if not truncated:
        truncated = text[:max_chars]

    return truncated.strip()


def es_truncate_text(text: str, max_chars: int) -> str:
    """
    Trunca el texto para que no exceda max_chars, asegurándose de cortar al final de una oración.
    Si ninguna oración entera cabe, se forza el truncamiento.
    """
    if len(text) <= max_chars:
        return text

    # Especificar language="spanish" para tokenizar correctamente en español.
    sentences = sent_tokenize(text, language="spanish")
    truncated = ""
    for sentence in sentences:
        # Verificar si al agregar la siguiente oración se excede el límite
        if len(truncated) + len(sentence) + (1 if truncated else 0) > max_chars:
            break
        truncated += (" " if truncated else "") + sentence

    # Si ninguna oración entera cabe, forzamos el truncamiento
    if not truncated:
        truncated = text[:max_chars]

    return truncated.strip()
