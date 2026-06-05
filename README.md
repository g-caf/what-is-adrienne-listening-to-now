# Spotify Now Playing

A standalone one-page Express service for the current Spotify track widget.

## Local Setup

1. Copy `.env.example` to `.env`.
2. Fill in `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, and `SPOTIFY_REFRESH_TOKEN`.
3. Run `npm install`.
4. Run `npm run dev`.

The app serves the page at `/` and the data endpoint at `/api/spotify/now-playing`.

## Render

Use this directory as the service root.

- Build command: `npm install`
- Start command: `npm start`
- Environment variables: `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN`
