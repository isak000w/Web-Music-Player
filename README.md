# Web-Based Music Catalog & Player

A self-hosted Flask + SQLAlchemy web app for scanning, cataloguing, streaming, queuing and tagging your local audio library — complete with playlists, cover-art fetch, WebSocket-synced queue and installable PWA offline support.

## Features  
- **Drag-and-drop or folder upload** for `.mp3`, `.wav`, `.m4a`, `.flac` (batched, resumable)  
- Automatic metadata extraction (title, artist, album, genre, bitrate, duration) via **Mutagen**  
- Cover-art lookup (ID3 / embedded) or fallback folder `covers/` → displayed in sidebar  
- Responsive sortable **Library table** (Title | Artist | Duration | Bitrate | Genre | Type) with search-as-you-type  
- **Playlists**: create, rename, delete, play-through, add from Library (one-click)  
- Queue / Up-Next panel with drag-to-reorder, shuffle toggle, loop toggle, skip-logic and speed slider (0.1×-2×)  
- Waveform mini-visualizer (lazy-loaded) & keyboard-accessible controls (`Space`, `← →`, `Enter`)  
- Lyrics & Artist-info quick links (Genius) in sidebar; smart 404 handling for dead files  
- **Settings gear drop-up** (speed modifier, future toggles)  
- Progressive-Web-App: offline cache of player shell & last-seen playlist, “install” banner  
- Real-time queue sync across tabs via **Flask-SocketIO**   
- Persistent SQLite DB, alembic migrations and auto-scan on startup  

## Setup
```bash
git clone https://github.com/isak000w/Web-Music-Player/
cd Web-Music-Player

# Python ≥3.10 recommended
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

pip install -r requirements.txt

python app.py
```

## Screenshots
Main UI
<img width="1440" height="708" alt="1" src="https://github.com/user-attachments/assets/79e0c4af-2b55-4351-8e49-dc966b482a47" />

Viewing Artist Info
<img width="1440" height="708" alt="1" src="https://github.com/user-attachments/assets/bfa9b2f4-bcb4-4d5c-9cb7-2ea5ed6daa72" />
<img width="1440" height="708" alt="2" src="https://github.com/user-attachments/assets/5ee59439-d95d-4d34-b989-883c278945fa" />

Speed Modifier
<img width="234" height="153" alt="3" src="https://github.com/user-attachments/assets/7950dd57-0f2d-47eb-b5a0-eed2b124d875" />

Upload Menu
<img width="1440" height="708" alt="4" src="https://github.com/user-attachments/assets/6ca65eee-ac6f-4133-90e0-a4a40913923d" />


