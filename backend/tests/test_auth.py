
def test_register_user(client):
    response = client.post(
        "/users/register",
        json={
            "username": "testuser",
            "email": "testuser@gmail.com",
            "hashed_password": "testpassword"
        })
    assert response.status_code == 200
    assert (response.json()["message"] ==
            "User registered successfully")

def test_register_existing_email(client):
    client.post("/users/register", json={
        "username": "testuser2",
        "email": "testuser@gmail.com",
        "hashed_password": "testpassword"
    })

    response = client.post("/users/register", json={
        "username": "testuser",
        "email": "test@example.com",
        "hashed_password": "securepassword123"
    })

    assert response.status_code == 400
    assert response.json()["message"] == "Email already exists"

def test_register_existing_username(client):
    response = client.post("/users/register",
                json={
                    "username": "testuser",
                    "email": "testuser2@gmail.com",
                    "hashed_password": "testpassword"
                })

    assert response.status_code == 400
    assert response.json()["message"] == "Username already exists"


def test_login_user(client):
    client.post("/news/register", json={
        "username": "testuserlogin",
        "email": "testlogin@gmail.com",
        "hashed_password": "testpasswordlogin"
    })

    response = client.post("/news/login", data={
        "username": "testuserlogin",
        "password": "testpasswordlogin"
    })

    assert response.status_code == 200
    assert "access_token" in response.json()