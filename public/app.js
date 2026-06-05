(function () {
  const statusEl = document.querySelector('[data-spotify-status]');
  const embedEl = document.querySelector('[data-spotify-embed]');
  if (!statusEl || !embedEl) return;

  let currentEmbedTrackId = '';
  let hasRenderedTrack = false;

  function renderFallback(message, preserveRenderedTrack) {
    if (preserveRenderedTrack && hasRenderedTrack) {
      statusEl.textContent = 'NOW PLAYING';
      return;
    }

    statusEl.textContent = message;
    embedEl.innerHTML = '';
    currentEmbedTrackId = '';
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
      renderFallback('Spotify is quiet right now.', true);
      return;
    }

    statusEl.textContent = 'NOW PLAYING';
    renderEmbed(track);
    hasRenderedTrack = true;
  }

  async function fetchSpotify() {
    try {
      const response = await fetch('/api/spotify/now-playing', { cache: 'no-store' });
      if (!response.ok) {
        renderFallback('Spotify is offline.', true);
        return;
      }

      const payload = await response.json();
      if (payload.status === 'unauthorized') {
        renderFallback('Spotify is not connected yet.', true);
        return;
      }

      renderTrack(payload);
    } catch (error) {
      renderFallback('Spotify is offline.', true);
    }
  }

  fetchSpotify();
  setInterval(fetchSpotify, 30000);
}());
