import pytest
from unittest.mock import patch

from backend.src.services import classification_service as cs


@pytest.mark.parametrize(
    "text,expected_lang",
    [
        ("This is an English sentence.", "en"),
        ("Esta es una frase en español.", "es"),
        ("Ceci est une phrase en français.", "fr"),
    ],
)
def test_detect_language(text, expected_lang):
    assert cs.detect_language(text) == expected_lang


@pytest.mark.asyncio
@patch("backend.src.services.classification_service.tokenizer")
@patch("backend.src.services.classification_service.model")
def test_predict_fake_news(mock_model, mock_tokenizer):
    # Mock tokenización
    mock_tokenizer.texts_to_sequences.return_value = [[1, 2, 3]]

    # Mock model.predict
    mock_model.predict.return_value = [[0.85]]

    text = "This is a test news article in English."

    result = cs.predict_fake_news(text)

    assert isinstance(result, dict)
    assert "prediction" in result
    assert "probability" in result
    assert result["prediction"] in {"Real", "Fake"}
    assert 0 <= result["probability"] <= 1.0
