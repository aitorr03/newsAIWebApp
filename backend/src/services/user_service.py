from backend.src.client import db_client
from pydantic import EmailStr


def validate_username(username: str) -> str:
    if not (6 <= len(username) <= 12):
        raise ValueError("Username must be between 6 and 12 characters")
    if not all(c.isalnum() or c in "_-" for c in username):
        raise ValueError("Username can only contain letters, numbers, '_' and '-'")
    return username.lower()


def validate_password(password: str) -> str:
    if not (6 <= len(password) <= 15):
        raise ValueError("Password must be between 6 and 15 characters")
    if not any(c.islower() for c in password):
        raise ValueError("Password must contain at least one lowercase letter")
    if not any(c.isupper() for c in password):
        raise ValueError("Password must contain at least one uppercase letter")
    if not any(c.isdigit() for c in password):
        raise ValueError("Password must contain at least one digit")
    return password


def existing_username(username: str) -> bool:
    return db_client.local.users.find_one({"username": username}) is not None


def existing_email(email: EmailStr) -> bool:
    return db_client.local.users.find_one({"email": email}) is not None
