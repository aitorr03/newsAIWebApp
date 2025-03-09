def test_create_news(client):
    response = client.post(
        "/news/",
        json={
            "title": "Título de la noticia",
            "summary": "Este es el resumen que debe alcanzar una longitud mínima par que se procese la solicitud correctamente.",
            "category": "Deportes",
            "url": "https://ejemplo.com/noticia/prueba",
            "source": "El País",
            "result": "Real",
            "probability": 0.95,
        },
    )
    assert response.status_code == 201
    assert response.json()["message"] == "News created successfully"


def test_get_news_by_id(client):
    response = client.post(
        "/news/",
        json={
            "title": "Título de la noticia",
            "summary": "Este es el resumen que debe alcanzar una longitud mínima par que se procese la solicitud correctamente.",
            "category": "Deportes",
            "url": "https://ejemplo.com/noticia/prueba2",
            "source": "El País",
            "result": "Real",
            "probability": 0.95,
        },
    )
    news_id = response.json()["news_id"]

    response = client.get(f"/news/{news_id}")
    assert response.status_code == 200
    assert response.json()["title"] == "Breaking News"


def test_delete_news(client):

    news_response = client.post(
        "/news/",
        json={
            "title": "Título de la noticia",
            "summary": "Este es el resumen que debe alcanzar una longitud mínima par que se procese la solicitud correctamente.",
            "category": "Deportes",
            "url": "https://ejemplo.com/noticia/prueba3",
            "source": "El País",
            "result": "Real",
            "probability": 0.95,
        },
    )
    news_id = news_response.json()["news_id"]

    response = client.delete(f"/news/{news_id}")
    assert response.status_code == 200
    assert response.json()["message"] == "News deleted successfully"

    response = client.get(f"/news/{news_id}")
    assert response.status_code == 404
