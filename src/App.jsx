import React from "react"
import Panel from "./components/Panel"
import YouTubePanel from "./components/YouTubePanel"
import FaultyTerminal from "./components/FaultyTerminal"   // <-- ADD THIS
import { LINKS } from "./config"
import fallback from "./assets/fallback.png"
import "./components/FaultyTerminal.css";

export default function App() {
  const spotifyEmbed =
    "https://open.spotify.com/embed/playlist/3sK22p6qc6blOI0qdCk19f?utm_source=generator&theme=0"

  return (
    <div className="faulty-terminal-bg min-h-screen w-full relative overflow-hidden">

      {/* ⭐ BACKGROUND EFFECT (BEHIND EVERYTHING) ⭐ */}
      <FaultyTerminal
        className="absolute inset-0 -z-10"
        scale={1.5}
        gridMul={[2, 1]}
        digitSize={1.2}
        timeScale={1}
        pause={false}
        scanlineIntensity={1}
        glitchAmount={1}
        flickerAmount={1}
        noiseAmp={1}
        chromaticAberration={0}
        dither={0}
        curvature={0}
        tint="#ffffff"
        mouseReact={true}
        mouseStrength={0.6}
        pageLoadAnimation={false}
        brightness={1}
      />

      {/* ⭐ MAIN CONTENT ABOVE BACKGROUND ⭐ */}
      <div className="grid-main relative z-10">

        {/* TOP LEFT - TWITCH */}
        <div className="twitch-panel panel">
          <iframe
            src={`https://player.twitch.tv/?channel=${LINKS.twitchUser}&parent=${window.location.hostname}&autoplay=true&muted=true`}
            title="Twitch Stream"
            width="100%"
            height="100%"
            frameBorder="0"
            allowFullScreen
          ></iframe>
          <div className="panel-title absolute left-2 top-2">INDEPENDENCE DAY</div>
        </div>

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
        <div className="flex gap-4 items-stretch">
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
    </div>
  )
}
