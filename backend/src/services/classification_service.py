import pickle
from keras._tf_keras.keras.models import load_model
from keras.src.utils import pad_sequences
from langdetect import detect, DetectorFactory

DetectorFactory.seed = 0

model = load_model("backend/src/model_keras.keras")
with open("backend/src/tokenizer.pkl", "rb") as f:
    tokenizer = pickle.load(f)


def detect_language(text: str) -> str:
    try:
        return detect(text)
    except Exception:
        return "en"


def predict_fake_news(text: str) -> dict:
    try:

        if not isinstance(text, str):
            text = str(text)

        seq = tokenizer.texts_to_sequences([text])
        padded = pad_sequences(seq, maxlen=375, padding="post", truncating="post")

        raw_prob = float(model.predict(padded)[0][0])

        lang = detect_language(text)
        if lang != "en" and raw_prob < 0.55:
            adj_prob = min(raw_prob * 1.5, 1.0)
        else:
            adj_prob = raw_prob

        label = "Real" if adj_prob >= 0.5 else "Fake"

        return {"prediction": label, "probability": adj_prob}
    except Exception as e:
        return {"error": str(e)}
