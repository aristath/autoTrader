from fastapi import FastAPI

from sentinel.api.routers.tasks import router


def test_scheduler_declares_json_request_body():
    app = FastAPI()
    app.include_router(router, prefix="/api")

    operation = app.openapi()["paths"]["/api/scheduler"]["post"]

    assert "requestBody" in operation
    assert "application/json" in operation["requestBody"]["content"]
    assert not operation.get("parameters")
