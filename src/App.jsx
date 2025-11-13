import React from 'react';
import Panel from './components/Panel';
import YouTubePanel from './components/YouTubePanel';
import TwitchPanel from './components/TwitchPanel';  // ← import this
import { LINKS } from './config';
import fallback from './assets/fallback.png';

/**
 * App Layout (desktop fixed GTA proportions)
 */
export default function App() {
  const spotifyEmbed = "https://open.spotify.com/embed/playlist/3sK22p6qc6blOI0qdCk19f?utm_source=generator&theme=0";

  return (
    <div className="grid-main">
      {/* TOP LEFT - TWITCH */}
      <TwitchPanel />

      {/* TOP RIGHT - TWITTER + GITHUB */}
      <div className="right-column">
        <Panel
          title="TWITTER"
          link={LINKS.twitter}
          img="/src/assets/twitter.png"
          fallback={fallback}
        />
        <Panel
          title="GITHUB"
          link={LINKS.github}
          img="/src/assets/github.png"
          fallback={fallback}
        />
      </div>

      {/* BOTTOM LEFT - YOUTUBE + SPOTIFY */}
      <div style={{ display: 'flex', gap: '18px', alignItems: 'stretch' }}>
        <YouTubePanel />

        <div className="spotify-panel panel">
          <iframe
            title="Spotify Playlist"
            src={spotifyEmbed}
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
          ></iframe>
          <div className="panel-title absolute left-2 top-2">FINDERS KEEPERS</div>
        </div>
      </div>

      {/* BOTTOM RIGHT - DISCORD + PLAYSTATION */}
      <div className="right-column">
        <Panel
          title="DISCORD"
          link={LINKS.discord}
          img="/src/assets/discord.png"
          fallback={fallback}
        />
        <Panel
          title="PLAYSTATION"
          link={LINKS.playstation}
          img="/src/assets/playstation.png"
          fallback={fallback}
        />
      </div>
    </div>
  );
}
