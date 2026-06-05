(function () {
  const spotifyCard = document.querySelector('[data-spotify-card]');
  if (!spotifyCard) return;

  const art = spotifyCard.querySelector('[data-spotify-art]');
  const statusEl = spotifyCard.querySelector('[data-spotify-status]');
  const trackEl = spotifyCard.querySelector('[data-spotify-track]');
  const artistEl = spotifyCard.querySelector('[data-spotify-artist]');
  const linkEl = spotifyCard.querySelector('[data-spotify-link]');
  const embedEl = document.querySelector('[data-spotify-embed]');
  let currentEmbedTrackId = '';

  function renderFallback(message) {
    statusEl.textContent = message;
    trackEl.textContent = '';
    artistEl.textContent = '';
    linkEl.href = '';
    linkEl.style.display = 'none';
    art.src = '';
    art.alt = '';

    if (embedEl) {
      embedEl.innerHTML = '';
      currentEmbedTrackId = '';
    }
  }

  function renderEmbed(track) {
    if (!embedEl) return;

    const trackId = track && track.id ? track.id : '';
    if (!trackId) {
      embedEl.innerHTML = '';
      currentEmbedTrackId = '';
      return;
    }
    if (trackId === currentEmbedTrackId) return;

    currentEmbedTrackId = trackId;
    const embedHeight = embedEl.dataset.spotifyEmbedHeight || '152';
    const iframe = document.createElement('iframe');
    iframe.title = `Spotify Embed: ${track.name || 'Current track'}`;
    iframe.src = `https://open.spotify.com/embed/track/${encodeURIComponent(trackId)}?utm_source=generator`;
    iframe.width = '100%';
    iframe.height = embedHeight;
    iframe.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
    iframe.loading = 'lazy';
    iframe.style.height = `${embedHeight}px`;
    embedEl.replaceChildren(iframe);
  }

  function renderTrack(payload) {
    const track = payload.track;
    if (!track) {
      renderFallback('Spotify is quiet right now.');
      return;
    }

    statusEl.textContent = payload.status === 'playing' ? 'Now playing' : 'Last played';
    trackEl.textContent = track.name || '';
    artistEl.textContent = (track.artists || []).join(', ');
    linkEl.href = track.trackUrl || '';
    linkEl.style.display = track.trackUrl ? 'inline-flex' : 'none';

    art.src = track.albumImage || '';
    art.alt = track.album ? `Album art for ${track.album}` : '';

    renderEmbed(track);
  }

  async function fetchSpotify() {
    try {
      const response = await fetch('/api/spotify/now-playing', { cache: 'no-store' });
      if (!response.ok) {
        renderFallback('Spotify is offline.');
        return;
      }

      const payload = await response.json();
      if (payload.status === 'unauthorized') {
        renderFallback('Spotify is not connected yet.');
        return;
      }

      renderTrack(payload);
    } catch (error) {
      renderFallback('Spotify is offline.');
    }
  }

  fetchSpotify();
  setInterval(fetchSpotify, 30000);
}());
