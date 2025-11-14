import React, { forwardRef, useImperativeHandle, useRef, useState } from "react";
import "./VoidTransition.css";
import FuzzyText from "./FuzzyText";

const GRID_SIZE = 40; // <-- High resolution corruption grid

export default forwardRef(function VoidTransition(_, ref) {
  const [active, setActive] = useState(false);
  const [cells, setCells] = useState([]);
  const [showText, setShowText] = useState(false);
  const [targetUrl, setTargetUrl] = useState(null);

  const containerRef = useRef(null);

  useImperativeHandle(ref, () => ({
    triggerTransition(url, sourceElem) {
      if (!sourceElem) return;

      // Get click origin for radial corruption
      const rect = sourceElem.getBoundingClientRect();
      const origin = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };

      // Build high-res grid
      const newCells = [];
      for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
          newCells.push({
            x,
            y,
            delay: Math.random() * 400, // slight randomness for chaotic feel
            distance: 0
          });
        }
      }

      // Compute distance from origin for each cell → for propagation sorting
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      newCells.forEach(cell => {
        const cx = (cell.x / GRID_SIZE) * vw;
        const cy = (cell.y / GRID_SIZE) * vh;
        const dx = cx - origin.x;
        const dy = cy - origin.y;
        cell.distance = Math.sqrt(dx * dx + dy * dy);
      });

      // Sort so corruption expands outward from clicked card
      newCells.sort((a, b) => a.distance - b.distance);

      setCells(newCells);
      setTargetUrl(url);
      setActive(true);

      // Timeline:
      // 1) Corruption spreads
      // 2) At ~80% corruption → show fuzzy text
      setTimeout(() => setShowText(true), 900);

      // 3) Redirect after text flashes briefly
      setTimeout(() => {
        window.location.href = url;
      }, 1500);
    }
  }));

  return (
    <div
      ref={containerRef}
      className={`void-container ${active ? "void-active" : ""}`}
    >
      {/* Pixel corruption cells */}
      <div className="void-grid">
        {cells.map((cell, i) => (
          <div
            key={i}
            className="void-cell"
            style={{
              "--delay": `${cell.distance * 0.6 + cell.delay}ms`,
              "--gx": cell.x,
              "--gy": cell.y
            }}
          />
        ))}
      </div>

      {/* Fuzzy Text */}
      {showText && (
        <div className="void-text">
          <FuzzyText
            fontSize="5rem"
            baseIntensity={0.25}
            hoverIntensity={0.5}
            enableHover={false}
          >
            SEE YOU SOON
          </FuzzyText>
        </div>
      )}
    </div>
  );
});
