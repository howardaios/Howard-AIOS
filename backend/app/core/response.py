from typing import Any


def success(data: Any = None, message: str = "OK"):
    return {
        "success": True,
        "code": 0,
        "message": message,
        "data": data,
    }


def error(message: str = "Error", code: int = -1):
    return {
        "success": False,
        "code": code,
        "message": message,
        "data": None,
    }
