import React, { useEffect, useRef, useMemo, useCallback } from "react";
import { Renderer, Program, Mesh, Color, Triangle } from "ogl";
import "./FaultyTerminal.css";

/* Vertex shader */
const vertexShader = `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

/* Fragment shader: strength, frequency, spikes, wipes, mouse glow, proximity tint */
const fragmentShader = `
precision mediump float;

varying vec2 vUv;

uniform float iTime;
uniform vec3  iResolution;
uniform float uScale;

uniform vec2  uGridMul;
uniform float uDigitSize;
uniform float uScanlineIntensity;
uniform float uGlitchAmount;       // base glitch multiplier
uniform float uGlitchTimeBoost;    // strength ramp over time (JS-driven)
uniform float uGlitchFreqBoost;    // frequency ramp over time (JS-driven)
uniform float uGlitchSpike;        // spike (0..1) applied when random spike occurs
uniform float uGlitchSpikeIntensity; // spike intensity multiplier
uniform float uFlickerAmount;
uniform float uNoiseAmp;
uniform float uChromaticAberration;
uniform float uDither;
uniform float uCurvature;

uniform vec3  uBaseTint;
uniform vec3  uMouseTint;
uniform float uMouseTintStrength;

uniform vec2  uMouse;
uniform float uMouseStrength;
uniform float uUseMouse;
uniform float uPageLoadProgress;
uniform float uUsePageLoadAnimation;
uniform float uBrightness;

float time;

float hash21(vec2 p){
  p = fract(p * 234.56);
  p += dot(p, p + 34.56);
  return fract(p.x * p.y);
}

float random1(float x) {
  return fract(sin(x)*43758.5453123);
}

float noise(vec2 p)
{
  return sin(p.x * 10.0) * sin(p.y * (3.0 + sin(time * 0.090909))) + 0.2;
}

mat2 rotate(float angle)
{
  float c = cos(angle);
  float s = sin(angle);
  return mat2(c, -s, s, c);
}

float fbm(vec2 p)
{
  p *= 1.1;
  float f = 0.0;
  float amp = 0.5 * uNoiseAmp;

  mat2 modify0 = rotate(time * 0.02);
  f += amp * noise(p);
  p = modify0 * p * 2.0;
  amp *= 0.454545;

  mat2 modify1 = rotate(time * 0.02);
  f += amp * noise(p);
  p = modify1 * p * 2.0;
  amp *= 0.454545;

  mat2 modify2 = rotate(time * 0.08);
  f += amp * noise(p);

  return f;
}

float pattern(vec2 p, out vec2 q, out vec2 r) {
  vec2 offset1 = vec2(1.0);
  vec2 offset0 = vec2(0.0);
  mat2 rot01 = rotate(0.1 * time);
  mat2 rot1 = rotate(0.1);

  q = vec2(fbm(p + offset1), fbm(rot01 * p + offset1));
  r = vec2(fbm(rot1 * q + offset0), fbm(q + offset0));
  return fbm(p + r);
}

float digit(vec2 p){
    // grid controls background scale
    vec2 grid = uGridMul * 25.0;
    vec2 s = floor(p * grid) / grid;
    p = p * grid;
    vec2 q, r;
    float intensity = pattern(s * 0.1, q, r) * 1.3 - 0.03;

    if(uUseMouse > 0.5){
        vec2 mouseWorld = clamp(uMouse * uScale, 0.0, uScale);
        float distToMouse = distance(s, mouseWorld);

        // base mouse influence scaled by time-based factors in JS
        float rawInfluence = exp(-distToMouse * 20.0) * uMouseStrength * 22.0;
        float mouseInfluence = clamp(rawInfluence, 0.0, 40.0);

        intensity += mouseInfluence;
        float ripple = sin(distToMouse * (18.0 + uGlitchFreqBoost*6.0) - iTime * (6.0 + uGlitchFreqBoost*2.0)) * 0.14 * mouseInfluence;
        intensity += ripple;
    }

    if(uUsePageLoadAnimation > 0.5){
        float cellRandom = fract(sin(dot(s, vec2(12.9898, 78.233))) * 43758.5453);
        float cellDelay = cellRandom * 0.8;
        float cellProgress = clamp((uPageLoadProgress - cellDelay) / 0.2, 0.0, 1.0);
        float fadeAlpha = smoothstep(0.0, 1.0, cellProgress);
        intensity *= fadeAlpha;
    }

    p = fract(p);
    p *= uDigitSize;

    float px5 = p.x * 5.0;
    float py5 = (1.0 - p.y) * 5.0;
    float x = fract(px5);
    float y = fract(py5);

    float i = floor(py5) - 2.0;
    float j = floor(px5) - 2.0;
    float n = i * i + j * j;
    float f = n * 0.0625;

    float isOn = step(0.1, intensity - f);
    float brightness = isOn * (0.2 + y * 0.8) * (0.75 + x * 0.25);

    return brightness;
}

float onOff(float a, float b, float c)
{
  return step(c, sin(iTime + a * cos(iTime * b))) * uFlickerAmount;
}

// displacement with frequency & spike influence; spike can generate wipe-like motion
float displace(vec2 look)
{
    float y = look.y - mod(iTime * 0.25, 1.0);
    float window = 1.0 / (1.0 + 50.0 * y * y);

    // base ripple frequency affected by uGlitchFreqBoost
    float rippleFreq = 20.0 + uGlitchFreqBoost * 40.0;

    // spike-driven extra displacement (wipe)
    float spike = uGlitchSpike * uGlitchSpikeIntensity;
    float wipe = spike * smoothstep(0.0, 1.0, 1.0 - abs(mod(iTime * 0.5, 2.0) - 1.0)); // short wipe envelope

    return sin(look.y * rippleFreq + iTime * (1.0 + uGlitchFreqBoost * 2.0)) * 0.0125 * onOff(4.0, 2.0, 0.8) * (1.0 + cos(iTime * 60.0)) * window * (1.0 + spike*2.0) + wipe * 0.05 * spike;
}

vec3 getColor(vec2 p){

    float bar = step(mod(p.y + time * 20.0, 1.0), 0.2) * 0.4 + 1.0;
    bar *= uScanlineIntensity;

    float displacement = displace(p);

    // total glitch power: base * (1 + timeBoost) + spike
    float glitchPower = uGlitchAmount * (1.0 + uGlitchTimeBoost) + uGlitchSpike * uGlitchSpikeIntensity;

    p.x += displacement * glitchPower;

    float middle = digit(p);

    const float off = 0.002;
    float sum = digit(p + vec2(-off, -off)) + digit(p + vec2(0.0, -off)) + digit(p + vec2(off, -off)) +
                digit(p + vec2(-off, 0.0)) + digit(p) + digit(p + vec2(off, 0.0)) +
                digit(p + vec2(-off, off)) + digit(p + vec2(0.0, off)) + digit(p + vec2(off, off));

    vec3 baseColor = vec3(1.0) * middle + sum * 0.1 * vec3(1.0) * bar;
    return baseColor;
}

vec2 barrel(vec2 uv){
  vec2 c = uv * 2.0 - 1.0;
  float r2 = dot(c, c);
  c *= 1.0 + uCurvature * r2;
  return c * 0.5 + 0.5;
}

void main() {
    time = iTime * 0.333333;
    vec2 uv = vUv;

    if(uCurvature != 0.0){
      uv = barrel(uv);
    }

    vec2 p = uv * uScale;
    vec3 col = getColor(p);

    if(uChromaticAberration != 0.0 && uUseMouse > 0.5){
      vec2 ca = vec2(uChromaticAberration * (1.0 + uGlitchTimeBoost * 0.1)) / iResolution.xy;
      float r = getColor(p + ca).r;
      float b = getColor(p - ca).b;
      col = vec3(r, col.g, b);
    }

    // Proximity-based additive mouse glow
    float d = distance(uv, uMouse);
    float proximity = pow(1.0 - clamp(d * 4.0, 0.0, 1.0), 2.0);

    vec3 base = col * uBaseTint * uBrightness;
    vec3 mouseGlow = uMouseTint * (proximity * uMouseTintStrength);

    // final color (clamp at end)
    vec3 finalCol = base + mouseGlow;

    if(uDither > 0.0){
      float rnd = hash21(gl_FragCoord.xy);
      finalCol += (rnd - 0.5) * (uDither * 0.003922);
    }

    finalCol = clamp(finalCol, 0.0, 1.0);

    gl_FragColor = vec4(finalCol, 1.0);
}
`;

/* helper: hex -> normalized rgb array */
function hexToRgb(hex) {
  let h = hex.replace("#", "").trim();
  if (h.length === 8) h = h.slice(0, 6); // drop alpha if provided
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const num = parseInt(h, 16);
  return [((num >> 16) & 255) / 255, ((num >> 8) & 255) / 255, (num & 255) / 255];
}

export default function FaultyTerminal({
  scale = 1,
  gridMul = [2, 1],
  digitSize = 1.5,
  timeScale = 0.3,
  pause = false,
  scanlineIntensity = 0.3,
  glitchAmount = 1,
  flickerAmount = 1,
  noiseAmp = 0,
  chromaticAberration = 0.6,
  dither = 0,
  curvature = 0.2,

  // color & mouse glow
  baseTint = "#ff0000ff", // default green-ish background
  mouseReact = true,
  mouseStrength = 0.6,
  mouseTint = "#4400ffff",
  mouseTintStrength = 1.0,

  // glitch-over-time controls (strength + frequency + spikes)
  glitchOverTime = true,
  glitchMaxBoost = 30,      // max strength multiplier added by time
  glitchFreqMax = 10.0,      // max frequency boost multiplier (applied to some ripple math)
  glitchRampSpeed = 0.01,   // ramp speed (higher = faster)
  // spikes
  spikeChance = 0.008,      // base chance per frame to spawn a spike (multiplied by time-norm)
  spikeIntensityMax = 3.0,  // how violent a spike can be
  spikeDecay = 0.6,         // how fast spike decays (1 = fast, lower = slower)

  dpr = Math.min(window.devicePixelRatio || 1, 2),
  pageLoadAnimation = true,
  brightness = 1,
  className,
  style,
  ...rest
}) {
  const containerRef = useRef(null);
  const programRef = useRef(null);
  const rendererRef = useRef(null);

  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const smoothMouseRef = useRef({ x: 0.5, y: 0.5 });

  const frozenTimeRef = useRef(0);
  const rafRef = useRef(0);

  const loadAnimationStartRef = useRef(0);
  const timeOffsetRef = useRef(Math.random() * 100);

  const startTimeRef = useRef(null);
  const activeSpikeRef = useRef({ value: 0, endTime: 0 });

  const baseTintVec = useMemo(() => hexToRgb(baseTint), [baseTint]);
  const mouseTintVec = useMemo(() => hexToRgb(mouseTint), [mouseTint]);

  const ditherValue = useMemo(
    () => (typeof dither === "boolean" ? (dither ? 1 : 0) : dither),
    [dither]
  );

  const handleMouseMove = useCallback((e) => {
    const ctn = containerRef.current;
    if (!ctn) return;
    const rect = ctn.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = 1 - (e.clientY - rect.top) / rect.height;
    mouseRef.current = { x, y };
  }, []);

  useEffect(() => {
    const ctn = containerRef.current;
    if (!ctn) return;

    const renderer = new Renderer({ dpr });
    rendererRef.current = renderer;
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 1);

    const geometry = new Triangle(gl);

    const program = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        iTime: { value: 0 },
        iResolution: {
          value: new Color(gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height),
        },

        uScale: { value: scale },

        uGridMul: { value: new Float32Array(gridMul) },
        uDigitSize: { value: digitSize },
        uScanlineIntensity: { value: scanlineIntensity },
        uGlitchAmount: { value: glitchAmount },
        uGlitchTimeBoost: { value: 0 },
        uGlitchFreqBoost: { value: 0 },
        uGlitchSpike: { value: 0 },
        uGlitchSpikeIntensity: { value: 0 },
        uFlickerAmount: { value: flickerAmount },
        uNoiseAmp: { value: noiseAmp },
        uChromaticAberration: { value: chromaticAberration },
        uDither: { value: ditherValue },
        uCurvature: { value: curvature },

        uBaseTint: { value: new Color(baseTintVec[0], baseTintVec[1], baseTintVec[2]) },
        uMouseTint: { value: new Color(mouseTintVec[0], mouseTintVec[1], mouseTintVec[2]) },
        uMouseTintStrength: { value: mouseTintStrength },

        uMouse: { value: new Float32Array([smoothMouseRef.current.x, smoothMouseRef.current.y]) },
        uMouseStrength: { value: mouseStrength },
        uUseMouse: { value: mouseReact ? 1 : 0 },

        uPageLoadProgress: { value: pageLoadAnimation ? 0 : 1 },
        uUsePageLoadAnimation: { value: pageLoadAnimation ? 1 : 0 },

        uBrightness: { value: brightness },
      },
    });
    programRef.current = program;

    const mesh = new Mesh(gl, { geometry, program });

    function resize() {
      if (!ctn || !renderer) return;
      renderer.setSize(ctn.offsetWidth, ctn.offsetHeight);
      program.uniforms.iResolution.value = new Color(gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height);
    }

    const resizeObserver = new ResizeObserver(() => resize());
    resizeObserver.observe(ctn);
    resize();

    const update = (t) => {
      rafRef.current = requestAnimationFrame(update);

      if (pageLoadAnimation && loadAnimationStartRef.current === 0) {
        loadAnimationStartRef.current = t;
      }

      if (!pause) {
        const elapsed = (t * 0.001 + timeOffsetRef.current) * timeScale;
        program.uniforms.iTime.value = elapsed;
        frozenTimeRef.current = elapsed;
      } else {
        program.uniforms.iTime.value = frozenTimeRef.current;
      }

      if (pageLoadAnimation && loadAnimationStartRef.current > 0) {
        const animationDuration = 2000;
        const animationElapsed = t - loadAnimationStartRef.current;
        const progress = Math.min(animationElapsed / animationDuration, 1);
        program.uniforms.uPageLoadProgress.value = progress;
      }

      if (mouseReact) {
        const damping = 0.08;
        smoothMouseRef.current.x += (mouseRef.current.x - smoothMouseRef.current.x) * damping;
        smoothMouseRef.current.y += (mouseRef.current.y - smoothMouseRef.current.y) * damping;

        const mu = program.uniforms.uMouse.value;
        mu[0] = smoothMouseRef.current.x;
        mu[1] = smoothMouseRef.current.y;
      }

      // glitch over time: both strength and frequency
      if (glitchOverTime) {
        if (startTimeRef.current === null) startTimeRef.current = t;
        const seconds = (t - startTimeRef.current) * 0.001;

        // normalized 0..1 with aggressive ease-out curve
        let normalized = Math.pow(1.0 - Math.exp(-seconds * glitchRampSpeed), 2.5);
        normalized = Math.min(Math.max(normalized, 0), 1);

        // strength boost
        const strengthBoost = normalized * glitchMaxBoost;
        program.uniforms.uGlitchTimeBoost.value = strengthBoost;

        // frequency boost (smaller scale)
        const freqBoost = normalized * glitchFreqMax;
        program.uniforms.uGlitchFreqBoost.value = freqBoost;

        // gradually increase chance of spike as time goes (not deterministic)
        const timeScaledChance = spikeChance * (1.0 + normalized * 8.0);

        // attempt to spawn a spike (stochastic)
        if (Math.random() < timeScaledChance) {
          // assign a spike
          const intensity = 0.5 + Math.random() * (spikeIntensityMax - 0.5); // min 0.5
          activeSpikeRef.current.value = intensity;
          activeSpikeRef.current.endTime = t + 1000 * (0.5 + intensity * spikeDecay);
        }
      }

      // manage active spike decay
      if (activeSpikeRef.current.value > 0) {
        const now = t;
        const remaining = Math.max(0, activeSpikeRef.current.endTime - now);
        const total = Math.max(1, (activeSpikeRef.current.endTime - (startTimeRef.current || now)));
        // spike factor 0..1
        const spikeFactor = remaining / total;
        program.uniforms.uGlitchSpike.value = spikeFactor;
        program.uniforms.uGlitchSpikeIntensity.value = activeSpikeRef.current.value * spikeFactor;

        if (remaining <= 0) {
          activeSpikeRef.current.value = 0;
          activeSpikeRef.current.endTime = 0;
          program.uniforms.uGlitchSpike.value = 0;
          program.uniforms.uGlitchSpikeIntensity.value = 0;
        }
      } else {
        program.uniforms.uGlitchSpike.value = 0;
        program.uniforms.uGlitchSpikeIntensity.value = 0;
      }

      renderer.render({ scene: mesh });
    };

    rafRef.current = requestAnimationFrame(update);

    // append canvas and make sure it doesn't block interactions
    ctn.appendChild(gl.canvas);
    gl.canvas.style.position = "absolute";
    gl.canvas.style.inset = "0";
    gl.canvas.style.width = "100%";
    gl.canvas.style.height = "100%";
    gl.canvas.style.pointerEvents = "none";
    gl.canvas.style.zIndex = "0";

    // listen to window mouse so panels don't block it
    if (mouseReact) window.addEventListener("mousemove", handleMouseMove);

    return () => {
      cancelAnimationFrame(rafRef.current);
      resizeObserver.disconnect();
      if (mouseReact) window.removeEventListener("mousemove", handleMouseMove);
      if (gl.canvas.parentElement === ctn) ctn.removeChild(gl.canvas);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      loadAnimationStartRef.current = 0;
      timeOffsetRef.current = Math.random() * 100;
      startTimeRef.current = null;
      activeSpikeRef.current = { value: 0, endTime: 0 };
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    dpr,
    pause,
    timeScale,
    scale,
    gridMul,
    digitSize,
    scanlineIntensity,
    glitchAmount,
    flickerAmount,
    noiseAmp,
    chromaticAberration,
    ditherValue,
    curvature,
    baseTintVec,
    mouseTintVec,
    mouseReact,
    mouseStrength,
    mouseTintStrength,
    glitchOverTime,
    glitchMaxBoost,
    glitchFreqMax,
    glitchRampSpeed,
    spikeChance,
    spikeIntensityMax,
    spikeDecay,
    pageLoadAnimation,
    brightness,
    handleMouseMove,
  ]);

  return <div ref={containerRef} className={`faulty-terminal-container ${className || ""}`} style={style} {...rest} />;
}
