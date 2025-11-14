import React, { useEffect, useState } from 'react';
import { LINKS } from '../config';

/**
 * TwitchPanel - compliant with Twitch embed policies.
 * - Dynamically adds the correct parent param for localhost/deployment.
 * - Ensures iframe is visible, not overlapped, and autoplay works.
 * - No overlays on top of iframe (Twitch blocks that).
 */
export default function TwitchPanel() {
  const [embedUrl, setEmbedUrl] = useState('');

  useEffect(() => {
    const hostname = window.location.hostname || 'localhost';
    const channelName = LINKS.twitch.split('/').filter(Boolean).pop() || 'taste_de_rambo';
    const params = new URLSearchParams({
      channel: channelName,
      parent: hostname,
      autoplay: 'true',
      muted: 'true'
    });
    setEmbedUrl(`https://player.twitch.tv/?${params.toString()}`);
  }, []);

  return (
    <div
      className="panel relative w-[760px] h-[420px] overflow-hidden rounded-2xl"
      style={{ zIndex: 0 }} // ensure it's not covered by anything
    >
      {embedUrl && (
        <iframe
          title="Twitch Stream"
          src={embedUrl}
          width="100%"
          height="100%"
          allow="autoplay; fullscreen; picture-in-picture"
          frameBorder="0"
          scrolling="no"
          style={{
            display: 'block',
            border: 'none',
            zIndex: 0,
            pointerEvents: 'auto',
          }}
        ></iframe>
      )}
    </div>
  );
}
