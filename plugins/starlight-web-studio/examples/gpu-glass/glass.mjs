import * as THREE from 'three';
import { gpuPlan, readEnv, withinBudget, medianMs } from './glass-gate.mjs';

const PROBE_FRAMES = 12;

const vertex = /* glsl */ `
void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

// One full-screen pass. Outside the panel it draws the photograph as-is (so it can
// replace the CSS poster pixel for pixel); inside it refracts at the bevel, splits
// the channels slightly, frosts the interior and adds a rim light.
const fragment = /* glsl */ `
precision highp float;
uniform sampler2D uImage;
uniform vec2 uImageSize;
uniform vec2 uRes;
uniform vec2 uBuf;
uniform vec4 uRect;
uniform float uRadius;
uniform vec2 uPointer;
uniform float uLit;

// Matches CSS background-size: cover; background-position: center.
// A screen wider than the image (sr > ir) crops the image vertically, and vice versa.
vec2 coverUV(vec2 p) {
  vec2 uv = p / uRes;
  float sr = uRes.x / uRes.y;
  float ir = uImageSize.x / uImageSize.y;
  if (sr > ir) { float s = ir / sr; uv.y = uv.y * s + (1.0 - s) * 0.5; }
  else { float s = sr / ir; uv.x = uv.x * s + (1.0 - s) * 0.5; }
  return vec2(uv.x, 1.0 - uv.y);
}

float sdRoundRect(vec2 p, vec2 halfSize, float r) {
  vec2 q = abs(p) - halfSize + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

float sd(vec2 p) {
  vec2 c = uRect.xy + uRect.zw * 0.5;
  return sdRoundRect(p - c, uRect.zw * 0.5, uRadius);
}

vec3 frosted(vec2 p) {
  vec3 acc = texture2D(uImage, coverUV(p)).rgb;
  for (int i = 0; i < 12; i++) {
    float a = float(i) * 0.5235988;
    float rad = (i < 6) ? 7.0 : 14.0;
    acc += texture2D(uImage, coverUV(p + vec2(cos(a), sin(a)) * rad)).rgb;
  }
  return acc / 13.0;
}

void main() {
  // The drawing buffer is floored to whole device pixels, so map through its real size.
  vec2 p = vec2(gl_FragCoord.x, uBuf.y - gl_FragCoord.y) * (uRes / uBuf);
  float d = sd(p);
  vec3 base = texture2D(uImage, coverUV(p)).rgb;
  if (d > 1.5) { gl_FragColor = vec4(base, 1.0); return; }

  vec2 e = vec2(1.0, 0.0);
  vec2 n = normalize(vec2(sd(p + e.xy) - sd(p - e.xy), sd(p + e.yx) - sd(p - e.yx)) + 1e-5);
  float edge = smoothstep(-22.0, 0.0, d);
  vec2 shift = -n * edge * edge * 26.0;

  vec3 glass;
  glass.r = frosted(p + shift * 1.06).r;
  glass.g = frosted(p + shift).g;
  glass.b = frosted(p + shift * 0.94).b;
  // With the 0.3 DOM tint on top, total coverage is 1 - 0.5 * 0.7 = 0.65, darker than the CSS glass (0.62).
  glass = mix(glass, vec3(0.039, 0.039, 0.043), 0.5);

  float rim = pow(edge, 3.0) * max(dot(n, normalize(vec2(-0.6, -0.8))), 0.0);
  glass += vec3(rim * 0.35);
  glass += vec3(uLit * exp(-dot(p - uPointer, p - uPointer) / 39200.0) * 0.10);

  float mask = 1.0 - smoothstep(-0.75, 0.75, d);
  gl_FragColor = vec4(mix(base, glass, mask), 1.0);
}
`;

const PREFERENCE_QUERIES = ['(prefers-reduced-motion: reduce)', '(prefers-reduced-transparency: reduce)'];

export async function mountGlass({ scene, canvas, panel, imageUrl, root = document.documentElement }) {
  const record = (mode, reason) => {
    root.dataset.glass = mode;
    root.dataset.glassReason = reason;
    return { mode, reason, teardown: () => {} };
  };
  const plan = gpuPlan(readEnv(window));
  if (plan.mode !== 'webgl') return record('css', plan.reason);

  // Everything acquired is registered here, so one teardown releases it on every path.
  const releases = [];
  let active = true;
  let queued = 0;
  const teardown = (reason) => {
    if (!active) return;
    active = false;
    if (queued) cancelAnimationFrame(queued);
    root.classList.remove('gl-glass');
    while (releases.length) releases.pop()();
    if (reason) record('css', reason);
  };

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'low-power' });
  releases.push(() => { renderer.dispose(); renderer.forceContextLoss(); });
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;

  let texture;
  try {
    texture = await new THREE.TextureLoader().loadAsync(imageUrl);
  } catch {
    teardown('image failed to load');
    return { mode: 'css', reason: root.dataset.glassReason, teardown };
  }
  releases.push(() => texture.dispose());
  texture.colorSpace = THREE.NoColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;

  const uniforms = {
    uImage: { value: texture },
    uImageSize: { value: new THREE.Vector2(texture.image.width, texture.image.height) },
    uRes: { value: new THREE.Vector2() },
    uBuf: { value: new THREE.Vector2() },
    uRect: { value: new THREE.Vector4() },
    uRadius: { value: 40 },
    uPointer: { value: new THREE.Vector2(-9999, -9999) },
    uLit: { value: 0 },
  };
  const geometry = new THREE.PlaneGeometry(2, 2);
  const material = new THREE.ShaderMaterial({ uniforms, vertexShader: vertex, fragmentShader: fragment });
  releases.push(() => { geometry.dispose(); material.dispose(); });
  const glScene = new THREE.Scene();
  glScene.add(new THREE.Mesh(geometry, material));
  const camera = new THREE.Camera();
  const buffer = new THREE.Vector2();

  const measure = () => {
    const s = scene.getBoundingClientRect();
    const r = panel.getBoundingClientRect();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(s.width, s.height, false);
    renderer.getDrawingBufferSize(buffer);
    uniforms.uRes.value.set(s.width, s.height);
    uniforms.uBuf.value.copy(buffer);
    uniforms.uRect.value.set(r.left - s.left, r.top - s.top, r.width, r.height);
    uniforms.uRadius.value = parseFloat(getComputedStyle(panel).borderTopLeftRadius) || 0;
  };
  let visible = true;
  const draw = () => { queued = 0; if (active) renderer.render(glScene, camera); };
  const request = () => { if (active && visible && !queued) queued = requestAnimationFrame(draw); };

  // Probe: the frame budget is measured on this device, not assumed. gl.finish() times
  // render plus GPU completion; it excludes page compositing, which CSS glass also pays.
  measure();
  const gl = renderer.getContext();
  const samples = [];
  for (let i = 0; i < PROBE_FRAMES; i++) {
    const t = performance.now();
    renderer.render(glScene, camera);
    gl.finish();
    samples.push(performance.now() - t);
  }
  root.dataset.glassMs = medianMs(samples).toFixed(2);
  if (!withinBudget(samples)) {
    teardown(`frame budget: ${root.dataset.glassMs} ms median`);
    return { mode: 'css', reason: root.dataset.glassReason, teardown };
  }

  const listen = (target, type, fn, opts) => {
    target.addEventListener(type, fn, opts);
    releases.push(() => target.removeEventListener(type, fn, opts));
  };
  const remeasure = () => { measure(); request(); };

  const ro = new ResizeObserver(remeasure);
  ro.observe(scene);
  ro.observe(panel);
  releases.push(() => ro.disconnect());
  const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; request(); });
  io.observe(scene);
  releases.push(() => io.disconnect());
  listen(window, 'scroll', remeasure, { passive: true });

  const dark = () => { uniforms.uLit.value = 0; request(); };
  listen(panel, 'pointermove', (e) => {
    if (e.pointerType !== 'mouse') { dark(); return; }
    const s = scene.getBoundingClientRect();
    uniforms.uPointer.value.set(e.clientX - s.left, e.clientY - s.top);
    uniforms.uLit.value = 1;
    request();
  });
  listen(panel, 'pointerleave', dark);
  listen(panel, 'pointercancel', dark);

  // Any change that would have refused WebGL at load refuses it now: preferences,
  // the phone breakpoint (the CSS switches photographs there), or a lost context.
  for (const q of PREFERENCE_QUERIES) {
    listen(window.matchMedia(q), 'change', (ev) => { if (ev.matches) teardown('preference changed'); });
  }
  listen(window.matchMedia('(min-width: 900px)'), 'change', (ev) => { if (!ev.matches) teardown('phone layout'); });
  listen(canvas, 'webglcontextlost', (ev) => { ev.preventDefault(); teardown('WebGL context lost'); });

  root.classList.add('gl-glass');
  record('webgl', plan.reason);
  request();
  return { mode: 'webgl', reason: plan.reason, teardown };
}
