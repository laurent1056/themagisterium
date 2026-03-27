// ─────────────────────────────────────────────────────────
// YouTube RSS Feed — fetches latest videos via rss2json.com
// No API key required. Free tier: 10 req/min.
// ─────────────────────────────────────────────────────────

async function loadYouTubeFeed() {
  if (!CONFIG.youtube.channelId || CONFIG.youtube.channelId === 'PASTE_YOUR_CHANNEL_ID_HERE') {
    console.info('YouTube channel ID not set in config.js — showing static fallback cards.');
    return;
  }

  const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${CONFIG.youtube.channelId}`;
  const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}&count=10`;

  try {
    const res = await fetch(apiUrl);
    const data = await res.json();
    if (data.status !== 'ok') throw new Error('Feed status: ' + data.status);
    if (!data.items || data.items.length === 0) throw new Error('No videos in feed');
    renderVideoCards(data.items);
  } catch (e) {
    console.warn('YouTube feed unavailable, showing static fallback:', e.message);
    // Static fallback cards remain in the DOM — no action needed
  }
}

function renderVideoCards(items) {
  const container = document.getElementById('video-feed');
  if (!container) return;

  container.innerHTML = items.map(item => {
    // Extract video ID from YouTube URL (handles ?v= and /shorts/ formats)
    let videoId = '';
    const vParam = item.link.split('v=')[1];
    if (vParam) {
      videoId = vParam.split('&')[0];
    } else if (item.link.includes('/shorts/')) {
      videoId = item.link.split('/shorts/')[1].split('?')[0];
    }

    const thumb = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
    const fallbackThumb = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    const pubDate = item.pubDate ? new Date(item.pubDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';

    return `
      <div class="flex-none w-[280px] aspect-[9/16] bg-surface-container-high relative group snap-start cursor-pointer border border-white/5"
           onclick="openVideo('${videoId}')" role="button" aria-label="Play: ${escapeAttr(item.title)}">
        <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent z-10"></div>
        <img class="absolute inset-0 w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-95 group-hover:scale-105 transition-all duration-700"
             src="${thumb}"
             alt="${escapeAttr(item.title)}"
             loading="lazy"
             onerror="this.onerror=null;this.src='${fallbackThumb}'"/>
        <div class="absolute top-4 right-4 z-20">
          <svg class="w-6 h-6 text-white/40 group-hover:text-primary transition-colors" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </div>
        <div class="absolute bottom-0 left-0 p-6 z-20 w-full">
          <div class="text-[10px] font-bold text-primary tracking-widest uppercase mb-2">Catholic Catechism${pubDate ? ' • ' + pubDate : ''}</div>
          <h4 class="text-xl font-headline leading-tight line-clamp-2">${escapeHtml(item.title)}</h4>
          <div class="h-0.5 w-0 group-hover:w-full bg-primary transition-all duration-500 mt-4"></div>
        </div>
      </div>`;
  }).join('');
}

function openVideo(videoId) {
  if (!videoId) return;
  const overlay = document.getElementById('video-overlay');
  const iframe = document.getElementById('video-iframe');
  if (!overlay || !iframe) return;
  iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
  overlay.classList.remove('hidden');
  overlay.classList.add('flex');
  document.body.style.overflow = 'hidden';
}

function closeVideoOverlay() {
  const overlay = document.getElementById('video-overlay');
  const iframe = document.getElementById('video-iframe');
  if (!overlay || !iframe) return;
  iframe.src = '';
  overlay.classList.add('hidden');
  overlay.classList.remove('flex');
  document.body.style.overflow = '';
}

// Escape helpers to prevent XSS from feed data
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
function escapeAttr(str) {
  return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Keyboard close support
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeVideoOverlay();
});

document.addEventListener('DOMContentLoaded', loadYouTubeFeed);
