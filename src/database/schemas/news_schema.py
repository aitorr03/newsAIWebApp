def news_schema(db_news: dict) -> dict:
    return {
        "id": str(db_news["_id"]),
        "title": db_news["title"],
        "summary": db_news["summary"],
        "category": db_news.get("category"),
        "url": db_news.get("url"),
        "source": db_news.get("source"),
        "date_analyzed": db_news.get("date_analyzed"),
        "result": db_news.get("result"),
        "probability": db_news.get("probability"),
        "query_count": db_news.get("query_count"),
    }
