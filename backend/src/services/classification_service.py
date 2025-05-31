import pickle
from keras._tf_keras.keras.models import load_model
from keras.src.utils import pad_sequences
from langdetect import detect, DetectorFactory

# Cargar el modelo y el tokenizer
model: load_model = load_model("backend/src/fake_news_model.keras")
with open("backend/src/tokenizer.pickle", "rb") as handle:
    tokenizer = pickle.load(handle)


def predict_fake_news(text: str) -> dict:
    try:

        if not isinstance(text, str):
            text = str(text)
        sequence = tokenizer.texts_to_sequences([text])
        padded_seq = pad_sequences(
            sequence, maxlen=200, padding="post", truncating="post"
        )

        # Obtener la probabilidad del modelo
        probability = model.predict(padded_seq)[0][0]

        # Definir el umbral
        label = "Fake" if probability >= 0.5 else "Real"

        return {"prediction": label, "probability": probability}
    except Exception as e:
        return {"error": str(e)}


DetectorFactory.seed = 0


def detect_language(text: str) -> str:
    try:
        return detect(text)
    except Exception:
        return "en"
