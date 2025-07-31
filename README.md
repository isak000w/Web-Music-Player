# Web-Based Music Catalog & Player

A self-hosted Flask application that lets you upload, scan, catalog, and play local audio files (`.mp3`, `.wav`, `.m4a`) through any modern browser.

## Features
- Upload individual files or drag-and-drop batches  
- Automatic library scan for new media  
- Persistent metadata storage in SQLite via SQLAlchemy  
- Browser playback with HTML5 `<audio>` and interactive queue  
- Filtering by genre, tags, and file type  

## Setup

```bash
git clone **https://github.com/isak000w/Web-Music-Player**
cd music-catalog-player
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python app.py
