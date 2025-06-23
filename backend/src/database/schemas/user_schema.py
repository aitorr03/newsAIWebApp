def user_schema(db_user: dict) -> dict:
    return {
        "id": str(db_user.get("_id")),
        "username": db_user.get("username", ""),
        "email": db_user.get("email", ""),
        "created_at": db_user.get("created_at"),
    }
