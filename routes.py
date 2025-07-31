"""
Flask blueprint for the **Music Catalog & Player** backend.

Features
────────
• Extracts cover art from APIC*, covr, or FLAC picture frames.  
• Reads ID3 `TCON` so the **Genre** column is populated.  
• Updates existing DB rows to back-fill missing cover or genre on re-scan.  
• Removes duplicate rows each scan.  
• Adds legacy alias `scan_media` → `scan_library` for backward-compat.
"""

from __future__ import annotations

import os
from typing import Optional

from flask import (
    Blueprint,
    current_app,
    jsonify,
    redirect,
    render_template,
    request,
    url_for,
)
from werkzeug.utils import secure_filename
from mutagen import File as MutagenFile

from models import Track, db

main = Blueprint("main", __name__)


# ───────────────────── helper functions ─────────────────────
def allowed_file(filename: str) -> bool:
    """Return *True* if filename extension is in ALLOWED_EXTENSIONS."""
    return (
        "." in filename
        and filename.rsplit(".", 1)[1].lower()
        in current_app.config["ALLOWED_EXTENSIONS"]
    )


def extract_metadata_and_cover(path: str) -> dict:
    """
    Parse tags, duration, bitrate, and embedded artwork.

    Returns dict that may include:
    ``title, artist, album, genre, duration, bitrate, cover_path``.
    """
    meta: dict = {}
    try:
        audio = MutagenFile(path)
        if not audio:
            return meta

        # duration / bitrate
        meta["duration"] = int(getattr(audio.info, "length", 0))
        bps = getattr(audio.info, "bitrate", 0)
        meta["bitrate"] = int(bps / 1000) if bps else 0

        tags = audio.tags or {}
        for src, dst in (
            ("title", "title"),
            ("TIT2", "title"),
            ("artist", "artist"),
            ("TPE1", "artist"),
            ("album", "album"),
            ("TALB", "album"),
            ("genre", "genre"),
            ("TCON", "genre"),  # ID3 genre frame
        ):
            if src in tags and dst not in meta:
                val = tags[src]
                meta[dst] = val[0] if isinstance(val, list) else str(val)

        # cover extraction
        cover_bytes: Optional[bytes] = None
        for k in tags:
            if k.startswith("APIC"):
                cover_bytes = tags[k].data
                break
        if not cover_bytes and "covr" in tags:
            cover_bytes = tags["covr"][0]
        if (
            not cover_bytes
            and "metadata_block_picture" in tags
            and tags["metadata_block_picture"]
        ):
            cover_bytes = tags["metadata_block_picture"][0].data

        if cover_bytes:
            media_root = current_app.config["UPLOAD_FOLDER"]
            cover_dir = os.path.join(media_root, "covers")
            os.makedirs(cover_dir, exist_ok=True)
            base = os.path.splitext(os.path.basename(path))[0]
            rel_cover = os.path.join("covers", f"{base}.jpg")
            with open(os.path.join(media_root, rel_cover), "wb") as fh:
                fh.write(cover_bytes)
            meta["cover_path"] = rel_cover
    except Exception:  # pragma: no cover
        pass
    return meta


def add_or_update_track(abs_path: str) -> None:
    """
    Insert new track or update existing one (fills missing cover/genre).

    Track uniqueness key = path **relative** to UPLOAD_FOLDER.
    """
    root = current_app.config["UPLOAD_FOLDER"]
    rel_path = os.path.relpath(abs_path, root)

    meta = extract_metadata_and_cover(abs_path)
    track = Track.query.filter_by(filepath=rel_path).first()

    if track:
        changed = False
        if not track.cover_path and meta.get("cover_path"):
            track.cover_path = meta["cover_path"]
            changed = True
        if not track.genre and meta.get("genre"):
            track.genre = meta["genre"]
            changed = True
        if changed:
            db.session.commit()
        return

    db.session.add(
        Track(
            title=meta.get("title", os.path.splitext(os.path.basename(rel_path))[0]),
            artist=meta.get("artist", "Unknown Artist"),
            album=meta.get("album", ""),
            genre=meta.get("genre", ""),
            duration=meta.get("duration", 0),
            bitrate=meta.get("bitrate", 0),
            filepath=rel_path,
            extension=os.path.splitext(rel_path)[1].lstrip("."),
            cover_path=meta.get("cover_path", ""),
        )
    )
    db.session.commit()


def prune_duplicates() -> None:
    """Delete DB rows that share the same filepath (legacy duplicates)."""
    seen: set[str] = set()
    for row in Track.query.all():
        if row.filepath in seen:
            db.session.delete(row)
        else:
            seen.add(row.filepath)
    db.session.commit()


def scan_library() -> None:
    """
    Walk *UPLOAD_FOLDER*, insert new audio or update metadata of existing ones.
    """
    media_root = current_app.config["UPLOAD_FOLDER"]
    prune_duplicates()
    for root, _, files in os.walk(media_root):
        for fname in files:
            if allowed_file(fname):
                add_or_update_track(os.path.join(root, fname))


# alias for backward-compat with older imports
scan_media = scan_library


# ──────────────────────── routes ─────────────────────────
@main.route("/")
def index():
    tracks = Track.query.order_by(Track.artist, Track.title).all()
    return render_template("index.html", tracks=tracks)


@main.route("/upload", methods=["POST"])
def upload():
    """
    Handle drag-and-drop or file/folder selection uploads.
    """
    for f in request.files.getlist("file"):
        if f and allowed_file(f.filename):
            dst = os.path.join(
                current_app.config["UPLOAD_FOLDER"], secure_filename(f.filename)
            )
            f.save(dst)
            add_or_update_track(dst)
    return redirect(url_for("main.index"))


@main.route("/scan", methods=["POST"])
def scan():
    scan_library()
    return jsonify(status="scan complete")


@main.route("/api/tracks")
def api_tracks():
    """
    Return the full library as JSON.
    """
    return jsonify([t.as_dict() for t in Track.query.all()])