require('dotenv').config();

const path = require('path');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3001;
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API_URL = 'https://api.spotify.com/v1';

app.disable('x-powered-by');
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: process.env.NODE_ENV === 'production' ? '1h' : 0
}));

async function getSpotifyAccessToken() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    return null;
  }

  const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${authHeader}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    })
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return data.access_token || null;
}

function formatSpotifyTrack(item, isPlaying = false) {
  if (!item) return null;

  const artists = (item.artists || []).map((artist) => artist.name).filter(Boolean);
  const albumImages = item.album && Array.isArray(item.album.images) ? item.album.images : [];
  const albumImage = albumImages[0] ? albumImages[0].url : '';

  return {
    id: item.id,
    name: item.name,
    artists,
    album: item.album ? item.album.name : '',
    albumImage,
    trackUrl: item.external_urls ? item.external_urls.spotify : '',
    isPlaying,
    durationMs: item.duration_ms || 0,
    previewUrl: item.preview_url || null
  };
}

async function fetchSpotifyNowPlaying() {
  const accessToken = await getSpotifyAccessToken();
  if (!accessToken) return { status: 'unauthorized' };

  const headers = { Authorization: `Bearer ${accessToken}` };
  const nowPlayingRes = await fetch(`${SPOTIFY_API_URL}/me/player/currently-playing`, { headers });

  if (nowPlayingRes.status === 204) {
    const recentRes = await fetch(`${SPOTIFY_API_URL}/me/player/recently-played?limit=1`, { headers });
    if (!recentRes.ok) return { status: 'offline' };

    const recentData = await recentRes.json();
    const recentItem = recentData.items && recentData.items[0] ? recentData.items[0] : null;

    return {
      status: recentItem ? 'recent' : 'offline',
      track: recentItem ? formatSpotifyTrack(recentItem.track, false) : null,
      playedAt: recentItem ? recentItem.played_at : null
    };
  }

  if (!nowPlayingRes.ok) {
    return { status: 'error' };
  }

  const nowPlayingData = await nowPlayingRes.json();
  const track = formatSpotifyTrack(nowPlayingData.item, !!nowPlayingData.is_playing);

  return {
    status: track ? 'playing' : 'offline',
    track,
    progressMs: nowPlayingData.progress_ms || 0
  };
}

app.get('/api/spotify/now-playing', async (req, res) => {
  try {
    const payload = await fetchSpotifyNowPlaying();
    res.setHeader('Cache-Control', 'no-store');

    if (payload.status === 'unauthorized') {
      return res.status(503).json({ status: 'unauthorized' });
    }

    return res.json(payload);
  } catch (error) {
    return res.status(502).json({ status: 'error' });
  }
});

app.get('/healthz', (req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Spotify now-playing service listening on port ${PORT}`);
});
