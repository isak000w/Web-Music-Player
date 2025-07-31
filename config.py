"""
Centralized configuration for the application.
"""

import os

BASE_DIR = os.path.abspath(os.path.dirname(__file__))


class Config:
    """
    Default configuration values. Override with environment variables when needed.
    """

    SECRET_KEY = os.environ.get("SECRET_KEY", "change-me")
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URI", "sqlite:///" + os.path.join(BASE_DIR, "music.db")
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # All media sits inside the project’s ./media folder
    UPLOAD_FOLDER = os.environ.get("UPLOAD_FOLDER", os.path.join(BASE_DIR, "media"))
    ALLOWED_EXTENSIONS = {"mp3", "wav", "m4a"}