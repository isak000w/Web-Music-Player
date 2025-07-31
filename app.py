"""
Entry point for the Web-Based Music Catalog & Player.
"""

import os
from flask import Flask, send_from_directory
from config import Config
from models import db
from routes import main as main_blueprint, scan_media


def create_app() -> Flask:
    """
    Application factory that builds and configures the Flask app.
    """
    app = Flask(__name__, static_folder="static")
    app.config.from_object(Config)

    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

    db.init_app(app)
    with app.app_context():
        db.create_all()
        # Auto-scan library on server start
        scan_media()

    app.register_blueprint(main_blueprint)

    @app.route("/media/<path:filename>")
    def media(filename: str):
        """
        Serve uploaded audio files from the media directory.
        """
        return send_from_directory(app.config["UPLOAD_FOLDER"], filename)

    return app


if __name__ == "__main__":
    create_app().run(host="0.0.0.0", port=5001, debug=True)