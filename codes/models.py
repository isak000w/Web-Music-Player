"""
Database models for the music catalog.
"""

from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class Track(db.Model):
    """
    Represents an audio track stored locally.
    """

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(256), nullable=False)
    artist = db.Column(db.String(256), default="Unknown Artist")
    album = db.Column(db.String(256), default="")
    genre = db.Column(db.String(128), default="")
    tags = db.Column(db.String(256), default="")
    filepath = db.Column(db.String(512), unique=True, nullable=False)
    duration = db.Column(db.Integer, default=0)  # seconds
    bitrate = db.Column(db.Integer, default=0)  # kbps
    extension = db.Column(db.String(16), nullable=False)
    cover_path = db.Column(db.String(512), default="")  # optional cover art location

    def as_dict(self) -> dict:
        """
        Return a JSON-serializable representation of the track.
        """
        return {
            "id": self.id,
            "title": self.title,
            "artist": self.artist,
            "album": self.album,
            "genre": self.genre,
            "tags": self.tags,
            "filepath": self.filepath,
            "duration": self.duration,
            "bitrate": self.bitrate,
            "extension": self.extension,
            "cover": self.cover_path,
        }