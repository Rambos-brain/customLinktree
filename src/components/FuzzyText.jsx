import React, { useEffect, useRef } from "react";

/**
 * FuzzyText – glitchy, fuzzy animated text
 *
 * Props:
 *  children            — text content
 *  fontSize            — CSS size value (default: clamp(2rem, 10vw, 10rem))
 *  fontWeight          — number (default: 900)
 *  fontFamily          — CSS font-family string
 *  color               — text color
 *  enableHover         — enables stronger hover glitch
 *  baseIntensity       — baseline fuzz (0–1)
 *  hoverIntensity      — fuzz intensity on hover (0–1)
 */
export default function FuzzyText({
  children,
  fontSize = "clamp(2rem, 10vw, 10rem)",
  fontWeight = 900,
  fontFamily = "inherit",
  color = "#ff0000ff",
  enableHover = true,
  baseIntensity = 0.9,
  hoverIntensity = 0.5,
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    let animationFrameId;
    let isCancelled = false;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const init = async () => {
      if (document.fonts?.ready) await document.fonts.ready;
      if (isCancelled) return;

      const text = React.Children.toArray(children).join("");

      // --- measure font size numerically ---
      const sizeProbe = document.createElement("span");
      sizeProbe.style.fontSize = fontSize;
      document.body.appendChild(sizeProbe);
      const numericFontSize = parseFloat(
        window.getComputedStyle(sizeProbe).fontSize
      );
      document.body.removeChild(sizeProbe);

      const realFontFamily =
        fontFamily === "inherit"
          ? window.getComputedStyle(canvas).fontFamily || "sans-serif"
          : fontFamily;

      const off = document.createElement("canvas");
      const offCtx = off.getContext("2d");
      offCtx.font = `${fontWeight} ${fontSize} ${realFontFamily}`;
      offCtx.textBaseline = "top";

      const metrics = offCtx.measureText(text);
      const width = Math.ceil(metrics.width);
      const height = Math.ceil(
        metrics.actualBoundingBoxAscent +
          metrics.actualBoundingBoxDescent ||
          numericFontSize
      );

      off.width = width;
      off.height = height;

      offCtx.font = `${fontWeight} ${fontSize} ${realFontFamily}`;
      offCtx.fillStyle = color;
      offCtx.textBaseline = "top";
      offCtx.fillText(text, 0, 0);

      // canvas size needs extra width for horizontal distortion
      const margin = 40;
      canvas.width = width + margin * 2;
      canvas.height = height;

      ctx.translate(margin, 0);

      let isHover = false;
      const fuzz = 60;

      function draw() {
        ctx.clearRect(-fuzz, 0, width + fuzz * 2, height);

        const intensity = isHover ? hoverIntensity : baseIntensity;

        for (let row = 0; row < height; row++) {
          const dx = (Math.random() - 0.5) * fuzz * intensity;
          ctx.drawImage(
            off,
            0,
            row,
            width,
            1,
            dx,
            row,
            width,
            1
          );
        }

        animationFrameId = requestAnimationFrame(draw);
      }

      draw();

      // hover detection
      const handleMove = (e) => {
        if (!enableHover) return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        isHover = x >= 0 && x <= rect.width;
      };

      const handleLeave = () => (isHover = false);

      if (enableHover) {
        canvas.addEventListener("mousemove", handleMove);
        canvas.addEventListener("mouseleave", handleLeave);
      }

      canvas.cleanup = () => {
        if (enableHover) {
          canvas.removeEventListener("mousemove", handleMove);
          canvas.removeEventListener("mouseleave", handleLeave);
        }
      };
    };

    init();

    return () => {
      isCancelled = true;
      cancelAnimationFrame(animationFrameId);
      if (canvas && canvas.cleanup) canvas.cleanup();
    };
  }, [
    children,
    fontSize,
    fontWeight,
    fontFamily,
    color,
    enableHover,
    baseIntensity,
    hoverIntensity,
  ]);

  return <canvas ref={canvasRef} style={{ display: "block" }} />;
}
