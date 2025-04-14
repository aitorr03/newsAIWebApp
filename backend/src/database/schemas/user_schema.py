def user_schema(db_user: dict) -> dict:
    return {
        "id": str(db_user["_id"]),
        "username": db_user["username"],
        "email": db_user["email"],
        "created_at": db_user.get("created_at"),
    }
