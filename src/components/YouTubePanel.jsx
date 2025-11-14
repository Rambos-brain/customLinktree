import React, { useEffect, useState } from 'react';
import { LINKS } from '../config';

/**
 * YouTube panel — plays the provided video or latest upload.
 * Crops horizontally to center (no stretching).
 */
export default function YouTubePanel() {
  const [embedId, setEmbedId] = useState(null);

  useEffect(() => {
    let mounted = true;
    const ytLink = LINKS.youtube || '';

    async function resolveVideo() {
      try {
        // If a full video link with ?v= exists
        if (ytLink.includes('watch?v=')) {
          const vid = new URL(ytLink).searchParams.get('v');
          if (vid) {
            if (mounted) setEmbedId(vid);
            return;
          }
        }

        // Otherwise, attempt RSS latest upload
        let handle = null;
        if (ytLink.includes('@')) {
          handle = ytLink.split('@')[1].replace('/', '');
        } else if (ytLink.includes('channel/')) {
          handle = ytLink.split('channel/')[1].split('/')[0];
        }

        if (handle) {
          const rssCandidates = [
            `https://www.youtube.com/feeds/videos.xml?user=${handle}`,
            `https://www.youtube.com/feeds/videos.xml?channel_id=${handle}`
          ];

          for (const rss of rssCandidates) {
            try {
              const res = await fetch(rss);
              if (!res.ok) continue;
              const text = await res.text();
              const m = text.match(/<yt:videoId>(.*?)<\/yt:videoId>/);
              if (m && m[1]) {
                if (mounted) setEmbedId(m[1]);
                return;
              }
            } catch (e) {}
          }
        }
      } catch (e) {}
    }

    resolveVideo();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="youtube-panel panel">
      {embedId ? (
        <iframe
          title="YouTube Player"
          src={`https://www.youtube.com/embed/${embedId}?autoplay=1&mute=1&controls=1&rel=0&modestbranding=1`}
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <a
          href={LINKS.youtube}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0 flex items-center justify-center"
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700 }}>YOUTUBE</div>
            <div style={{ opacity: 0.8 }}>Open channel</div>
          </div>
        </a>
      )}

      <div className="panel-title absolute left-2 top-2">YOUTUBE VIDEO</div>
    </div>
  );
}
