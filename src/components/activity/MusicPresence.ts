const CACHE_KEY = 'lastfm-last-played';
const CACHE_DURATION = 8 * 60 * 1000;
const MAX_RETRIES = 3;

const USERNAME = 'baradika';
const API_KEY = '27ff964552f4b4eeba3cee11bd08b86f';
const API_URL = `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${USERNAME}&api_key=${API_KEY}&format=json&limit=1`;

type Track = {
  name: string;
  artist: { '#text': string };
  album: { '#text': string };
  image: { '#text': string }[];
  url: string;
  '@attr'?: { nowplaying?: string };
};

type CachedData = {
  track: Track;
  timestamp: number;
};

function getCachedTrack(): Track | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const parsed: CachedData = JSON.parse(cached);
    const isExpired = Date.now() - parsed.timestamp > CACHE_DURATION;
    return isExpired ? null : parsed.track;
  } catch (err) {
    console.warn('Invalid cache. Clearing it.', err);
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
}

function setCachedTrack(track: Track): void {
  try {
    const cache: CachedData = { track, timestamp: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (err) {
    console.warn('Failed to cache track:', err);
  }
}

async function fetchTrackWithRetry(retries = MAX_RETRIES): Promise<Track | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(API_URL, {
      signal: controller.signal,
      headers: { 'Cache-Control': 'no-cache' },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const tracks = data?.recenttracks?.track;
    if (!tracks || tracks.length === 0) {
      return null;
    }

    // ambil track terbaru
    return tracks[0] as Track;
  } catch (error) {
    console.warn(`Fetch attempt failed (${MAX_RETRIES - retries + 1}):`, error);
    if (retries > 1) {
      return fetchTrackWithRetry(retries - 1);
    }
    return null;
  }
}

function renderTrack(container: HTMLElement, track: Track | null) {
  const skeleton = container.querySelector('#music-skeleton');
  const content = container.querySelector('#music-content');

  if (skeleton) skeleton.remove();
  if (!content) return;

  content.classList.remove('hidden');
  content.classList.add('flex');

  const albumArt = content.querySelector<HTMLImageElement>('#album-art');
  const nowPlaying = content.querySelector<HTMLElement>('#now-playing');
  const songLink = content.querySelector<HTMLAnchorElement>('#song-link');
  const songTitle = content.querySelector<HTMLElement>('#song-title');
  const artistName = content.querySelector<HTMLElement>('#artist-name');
  const separatorArtistName = content.querySelector<HTMLElement>('#separator-artist-name');
  const albumName = content.querySelector<HTMLElement>('#album-name');
  const separatorAlbumName = content.querySelector<HTMLElement>('#separator-album-name');

  if (!track) {
    if (albumArt) albumArt.style.backgroundImage = 'none';
    if (nowPlaying) nowPlaying.textContent = 'No song is currently playing';
    songTitle?.remove();
    artistName?.remove();
    separatorArtistName?.remove();
    albumName?.remove();
    separatorAlbumName?.remove();
    return;
  }

  const { name, artist, album, image, url, '@attr': attr } = track;

  if (artist['#text'].trim() === '') {
    separatorArtistName?.remove();
    separatorAlbumName?.remove();
  }

  if (album['#text'].trim() === '') {
    separatorAlbumName?.remove();
    albumName?.remove();
  }

  if (albumArt) {
    albumArt.src = image?.[2]?.['#text'] ||
      'https://lastfm.freetls.fastly.net/i/u/34s/2a96cbd8b46e442fc41c2b86b821562f.png';
  }

  if (nowPlaying) {
    nowPlaying.textContent = attr?.nowplaying ? 'Now playing...' : 'Last played...';
  }

  if (songLink) songLink.href = url;
  if (songTitle) songTitle.textContent = name;
  if (artistName) artistName.textContent = artist['#text'];
  if (albumName) albumName.textContent = album['#text'];

  console.log('Rendered track:', { name, artist: artist['#text'], album: album['#text'], url });
}

export function initMusicPresence(container: HTMLElement) {
  if (!container) return;

  const cached = getCachedTrack();
  if (cached) {
    renderTrack(container, cached);
    fetchTrackWithRetry().then(track => {
      if (track) {
        setCachedTrack(track);
        renderTrack(container, track);
      }
    });
  } else {
    fetchTrackWithRetry().then(track => {
      renderTrack(container, track);
      if (track) {
        setCachedTrack(track);
      }
    });
  }
}
