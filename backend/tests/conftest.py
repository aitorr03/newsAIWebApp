import sys
import os

# Agregar el directorio raíz del proyecto a sys.path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

import pytest
from fastapi.testclient import TestClient
from backend.src.main import app


@pytest.fixture
def client():
    return TestClient(app)
