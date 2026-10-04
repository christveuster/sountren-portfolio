import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import './CRTWarp.css';

const vertexShader = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

const fragmentShader = `
precision highp float;

varying vec2 vUv;
uniform vec2 uResolution;
uniform float uTime;
uniform vec3 uColor;
uniform vec3 uBackgroundColor;
uniform float uCurvature;
uniform float uScanlineStrength;
uniform float uScanlineFrequency;
uniform float uWaveAmplitude;
uniform float uWaveFrequency;
uniform float uBloom;
uniform float uBloomRadius;
uniform float uNoise;
uniform float uVignette;
uniform float uBrightness;
uniform float uPixelation;
uniform float uRgbShift;
uniform vec2 uPointer;
uniform float uMouseStrength;
uniform float uMouseReact;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

vec2 crtCurve(vec2 uv, float radius) {
  vec2 p = (uv - 0.5) * 2.0;
  float safeRadius = max(radius, 1.415);
  float cornerScale = safeRadius / sqrt(max(safeRadius * safeRadius - 2.0, 0.001));
  p = safeRadius * p / sqrt(max(safeRadius * safeRadius - dot(p, p), 0.001));
  p /= cornerScale;
  return p * 0.5 + 0.5;
}

float referencePlasma(vec2 uv, float t) {
  float frequencyScale = max(uWaveFrequency / 2.2, 0.001);
  uv = (uv - 0.5) * frequencyScale + 0.5;
  float scanline = 0.5 - 0.5 * cos(uv.y * 3.14159265 * uScanlineFrequency);
  scanline = mix(1.0, scanline, uScanlineStrength);
  uv *= vec2(80.0, 24.0);
  uv = ceil(uv);
  uv /= vec2(80.0, 24.0);

  float amplitude = uWaveAmplitude / 0.28;
  float field = 0.0;
  field += 0.7 * sin(0.5 * uv.x + t / 5.0);
  field += 3.0 * sin(1.6 * uv.y + t / 5.0);
  field += sin(10.0 * (uv.y * sin(t / 2.0) + uv.x * cos(t / 5.0)) + t / 2.0);
  float cx = uv.x + 0.5 * sin(t / 2.0);
  float cy = uv.y + 0.5 * cos(t / 4.0);
  field += 0.4 * sin(sqrt(100.0 * cx * cx + 100.0 * cy * cy + 1.0) + t);
  field += 0.9 * sin(sqrt(75.0 * cx * cx + 25.0 * cy * cy + 1.0) + t);
  field -= 1.4 * sin(sqrt(256.0 * cx * cx + 25.0 * cy * cy + 1.0) + t);
  field += 0.3 * sin(0.5 * uv.y + uv.x + sin(t));
  return scanline * floor(3.0 * (0.5 + 0.499 * sin(field * amplitude))) / 3.0;
}

void main() {
  vec2 uv = vUv;
  if (uPixelation > 1.001) {
    vec2 cells = max(uResolution / uPixelation, vec2(1.0));
    uv = (floor(uv * cells) + 0.5) / cells;
  }
  float curveRadius = 1.1 + 0.42 / max(uCurvature, 0.001);
  if (uMouseReact > 0.5) curveRadius *= exp(-uPointer.y * uMouseStrength * 0.4);
  vec2 curvedUv = crtCurve(uv, curveRadius);
  if (uMouseReact > 0.5) curvedUv.x -= uPointer.x * uMouseStrength * 0.035;

  float signal = referencePlasma(curvedUv, uTime);
  float radius = 0.01 * uBloomRadius;
  float glow = signal * 0.2;
  glow += referencePlasma(curvedUv + vec2(radius, 0.0), uTime) * 0.12;
  glow += referencePlasma(curvedUv - vec2(radius, 0.0), uTime) * 0.12;
  glow += referencePlasma(curvedUv + vec2(0.0, radius), uTime) * 0.12;
  glow += referencePlasma(curvedUv - vec2(0.0, radius), uTime) * 0.12;
  glow += referencePlasma(curvedUv + vec2(radius), uTime) * 0.08;
  glow += referencePlasma(curvedUv - vec2(radius), uTime) * 0.08;
  glow += referencePlasma(curvedUv + vec2(radius, -radius), uTime) * 0.08;
  glow += referencePlasma(curvedUv + vec2(-radius, radius), uTime) * 0.08;
  float redSignal = referencePlasma(curvedUv + vec2(uRgbShift, 0.0), uTime);
  float blueSignal = referencePlasma(curvedUv - vec2(uRgbShift, 0.0), uTime);
  vec3 channelSignal = vec3(redSignal, signal, blueSignal);
  vec3 waveColor = uColor * (0.3 + signal * 0.7 + glow * uBloom * 0.65);
  waveColor += (channelSignal - signal) * 0.42;

  float edge = clamp(1.0 - dot(vUv - 0.5, vUv - 0.5) * 2.0, 0.0, 1.0);
  float edgeFade = mix(1.0, smoothstep(0.0, 1.0, edge), uVignette);
  float waveMask = clamp(signal * 0.82 + glow * 0.52, 0.0, 1.0) * edgeFade;
  float grain = hash21(gl_FragCoord.xy + vec2(fract(uTime) * 173.0));
  waveColor = max(waveColor * uBrightness, vec3(0.0));
  vec3 outputColor = mix(uBackgroundColor, waveColor, waveMask);
  outputColor += (grain - 0.5) * uNoise;
  gl_FragColor = vec4(max(outputColor, vec3(0.0)), 1.0);
}
`;

const defaults = {
  color: '#c9e59a',
  backgroundColor: '#111713',
  speed: 0.45,
  curvature: 0.25,
  scanlineStrength: 0.25,
  scanlineFrequency: 200,
  waveAmplitude: 0.3,
  waveFrequency: 2.5,
  bloom: 1.25,
  bloomRadius: 1,
  noise: 0.08,
  vignette: 0.12,
  brightness: 1.15,
  pixelation: 1,
  rgbShift: 0.012,
  mouseReact: true,
  mouseStrength: 0.35,
  dpr: 1,
  fps: 30,
};

export default function CRTWarp({ paused = false, className = '', style = undefined, ...providedProps }) {
  const props = { ...defaults, ...providedProps };
  const containerRef = useRef(null);
  const materialRef = useRef(null);
  const rendererRef = useRef(null);
  const pausedRef = useRef(paused);
  const fpsRef = useRef(props.fps);
  const speedRef = useRef(props.speed);
  const mouseReactRef = useRef(props.mouseReact);
  const pointerTargetRef = useRef(new THREE.Vector2(0, 0));
  const pointerCurrentRef = useRef(new THREE.Vector2(0, 0));
  const [reducedMotion, setReducedMotion] = useState(false);
  const [webglAvailable, setWebglAvailable] = useState(true);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setReducedMotion(query.matches);
    updatePreference();
    query.addEventListener('change', updatePreference);
    return () => query.removeEventListener('change', updatePreference);
  }, []);

  useEffect(() => {
    pausedRef.current = paused || reducedMotion;
  }, [paused, reducedMotion]);

  useEffect(() => {
    fpsRef.current = Math.max(1, props.fps);
  }, [props.fps]);

  useEffect(() => {
    speedRef.current = props.speed;
    mouseReactRef.current = props.mouseReact;
  }, [props.speed, props.mouseReact]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uResolution: { value: new THREE.Vector2(1, 1) },
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(defaults.color) },
        uBackgroundColor: { value: new THREE.Color(defaults.backgroundColor) },
        uCurvature: { value: defaults.curvature },
        uScanlineStrength: { value: defaults.scanlineStrength },
        uScanlineFrequency: { value: defaults.scanlineFrequency },
        uWaveAmplitude: { value: defaults.waveAmplitude },
        uWaveFrequency: { value: defaults.waveFrequency },
        uBloom: { value: defaults.bloom },
        uBloomRadius: { value: defaults.bloomRadius },
        uNoise: { value: defaults.noise },
        uVignette: { value: defaults.vignette },
        uBrightness: { value: defaults.brightness },
        uPixelation: { value: defaults.pixelation },
        uRgbShift: { value: defaults.rgbShift },
        uPointer: { value: new THREE.Vector2(0, 0) },
        uMouseStrength: { value: defaults.mouseStrength },
        uMouseReact: { value: defaults.mouseReact ? 1 : 0 },
      },
    });
    materialRef.current = material;
    scene.add(new THREE.Mesh(geometry, material));

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'low-power' });
    } catch {
      geometry.dispose();
      material.dispose();
      materialRef.current = null;
      setWebglAvailable(false);
      return undefined;
    }

    rendererRef.current = renderer;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, props.dpr));
    renderer.domElement.setAttribute('aria-hidden', 'true');
    container.appendChild(renderer.domElement);
    setWebglAvailable(true);

    const resize = () => {
      renderer.setSize(Math.max(container.clientWidth, 1), Math.max(container.clientHeight, 1), false);
      material.uniforms.uResolution.value.set(renderer.domElement.width, renderer.domElement.height);
    };
    const resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(resize);
    if (resizeObserver) resizeObserver.observe(container);
    else window.addEventListener('resize', resize);
    resize();

    let visible = true;
    const visibilityObserver = typeof IntersectionObserver === 'undefined'
      ? null
      : new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
    visibilityObserver?.observe(container);

    let frameId = 0;
    let lastFrame = 0;
    let contextLost = false;
    const clock = new THREE.Clock();
    const render = (now) => {
      if (contextLost) return;
      frameId = requestAnimationFrame(render);
      if (!visible || document.hidden || now - lastFrame < 1000 / Math.max(1, fpsRef.current)) return;
      lastFrame = now;
      const delta = Math.min(clock.getDelta(), 0.1);
      if (!pausedRef.current) material.uniforms.uTime.value += delta * speedRef.current;
      pointerCurrentRef.current.lerp(pointerTargetRef.current, 0.08);
      material.uniforms.uPointer.value.copy(pointerCurrentRef.current);
      try {
        renderer.render(scene, camera);
      } catch {
        contextLost = true;
        cancelAnimationFrame(frameId);
        setWebglAvailable(false);
      }
    };
    const onContextLost = (event) => {
      event.preventDefault();
      contextLost = true;
      cancelAnimationFrame(frameId);
      setWebglAvailable(false);
    };
    const onContextRestored = () => {
      contextLost = false;
      setWebglAvailable(true);
      frameId = requestAnimationFrame(render);
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost, false);
    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored, false);
    frameId = requestAnimationFrame(render);

    const onPointerMove = (event) => {
      if (!mouseReactRef.current) return;
      const rect = container.getBoundingClientRect();
      pointerTargetRef.current.set(
        ((event.clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1,
        -(((event.clientY - rect.top) / Math.max(rect.height, 1)) * 2 - 1),
      );
    };
    const onPointerLeave = () => pointerTargetRef.current.set(0, 0);
    container.addEventListener('pointermove', onPointerMove, { passive: true });
    container.addEventListener('pointerleave', onPointerLeave);

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver?.disconnect();
      if (!resizeObserver) window.removeEventListener('resize', resize);
      visibilityObserver?.disconnect();
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerleave', onPointerLeave);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      materialRef.current = null;
      rendererRef.current = null;
    };
  }, []);

  useEffect(() => {
    const material = materialRef.current;
    const renderer = rendererRef.current;
    if (!material || !renderer) return;
    const uniforms = material.uniforms;
    uniforms.uColor.value.set(props.color);
    uniforms.uBackgroundColor.value.set(props.backgroundColor);
    uniforms.uCurvature.value = props.curvature;
    uniforms.uScanlineStrength.value = props.scanlineStrength;
    uniforms.uScanlineFrequency.value = props.scanlineFrequency;
    uniforms.uWaveAmplitude.value = props.waveAmplitude;
    uniforms.uWaveFrequency.value = props.waveFrequency;
    uniforms.uBloom.value = props.bloom;
    uniforms.uBloomRadius.value = props.bloomRadius;
    uniforms.uNoise.value = props.noise;
    uniforms.uVignette.value = props.vignette;
    uniforms.uBrightness.value = props.brightness;
    uniforms.uPixelation.value = props.pixelation;
    uniforms.uRgbShift.value = props.rgbShift;
    uniforms.uMouseReact.value = props.mouseReact ? 1 : 0;
    uniforms.uMouseStrength.value = props.mouseStrength;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, props.dpr));
    renderer.setSize(Math.max(containerRef.current.clientWidth, 1), Math.max(containerRef.current.clientHeight, 1), false);
    uniforms.uResolution.value.set(renderer.domElement.width, renderer.domElement.height);
  }, [props]);

  return (
    <div
      ref={containerRef}
      className={`crt-warp-container ${className}`}
      data-webgl={webglAvailable ? 'active' : 'fallback'}
      style={style}
      aria-hidden="true"
    >
      {!webglAvailable && <span className="crt-warp-fallback">Signal rendering unavailable</span>}
    </div>
  );
}