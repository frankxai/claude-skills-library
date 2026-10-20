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
uniform vec4 uRect;
uniform float uRadius;
uniform float uDpr;
uniform vec2 uPointer;
uniform float uLit;

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
  // 12-tap ring blur in pixel space, cheap enough for one panel.
  vec3 acc = texture2D(uImage, coverUV(p)).rgb;
  for (int i = 0; i < 12; i++) {
    float a = float(i) * 0.5235988;
    float rad = (i < 6) ? 7.0 : 14.0;
    acc += texture2D(uImage, coverUV(p + vec2(cos(a), sin(a)) * rad)).rgb;
  }
  return acc / 13.0;
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, uRes.y * uDpr - gl_FragCoord.y) / uDpr;
  float d = sd(p);
  vec3 base = texture2D(uImage, coverUV(p)).rgb;
  if (d > 1.5) { gl_FragColor = vec4(base, 1.0); return; }

  vec2 e = vec2(1.0, 0.0);
  vec2 n = normalize(vec2(sd(p + e.xy) - sd(p - e.xy), sd(p + e.yx) - sd(p - e.yx)) + 1e-5);
  float bevel = 22.0;
  float edge = smoothstep(-bevel, 0.0, d);
  vec2 shift = -n * edge * edge * 26.0;

  vec3 glass;
  glass.r = frosted(p + shift * 1.06).r;
  glass.g = frosted(p + shift).g;
  glass.b = frosted(p + shift * 0.94).b;
  // With the 0.3 DOM tint on top, total coverage is 1 - 0.5 * 0.7 = 0.65, darker than the CSS glass (0.62).
  glass = mix(glass, vec3(0.039, 0.039, 0.043), 0.5);

  float rim = pow(edge, 3.0) * max(dot(n, normalize(vec2(-0.6, -0.8))), 0.0);
  glass += vec3(rim * 0.35);
  float glow = uLit * exp(-dot(p - uPointer, p - uPointer) / (2.0 * 140.0 * 140.0)) * 0.10;
  glass += vec3(glow);

  float mask = 1.0 - smoothstep(-0.75, 0.75, d);
  gl_FragColor = vec4(mix(base, glass, mask), 1.0);
}
`;

export async function mountGlass({ scene, canvas, panel, imageUrl, root = document.documentElement }) {
  const plan = gpuPlan(readEnv(window));
  root.dataset.glass = plan.mode;
  root.dataset.glassReason = plan.reason;
  if (plan.mode !== 'webgl') return plan;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'low-power' });
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(dpr);

  const texture = await new THREE.TextureLoader().loadAsync(imageUrl);
  texture.colorSpace = THREE.NoColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;

  const uniforms = {
    uImage: { value: texture },
    uImageSize: { value: new THREE.Vector2(texture.image.width, texture.image.height) },
    uRes: { value: new THREE.Vector2() },
    uRect: { value: new THREE.Vector4() },
    uRadius: { value: 40 },
    uDpr: { value: dpr },
    uPointer: { value: new THREE.Vector2(-9999, -9999) },
    uLit: { value: 0 },
  };
  const glScene = new THREE.Scene();
  glScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ uniforms, vertexShader: vertex, fragmentShader: fragment })));
  const camera = new THREE.Camera();

  const measure = () => {
    const s = scene.getBoundingClientRect();
    const r = panel.getBoundingClientRect();
    renderer.setSize(s.width, s.height, false);
    uniforms.uRes.value.set(s.width, s.height);
    uniforms.uRect.value.set(r.left - s.left, r.top - s.top, r.width, r.height);
    uniforms.uRadius.value = parseFloat(getComputedStyle(panel).borderTopLeftRadius) || 0;
  };

  let queued = 0;
  let visible = true;
  const draw = () => { queued = 0; renderer.render(glScene, camera); };
  const request = () => { if (visible && !queued) queued = requestAnimationFrame(draw); };

  // Probe: the frame budget is measured on this device, not assumed.
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
    renderer.dispose();
    texture.dispose();
    root.dataset.glass = 'css';
    root.dataset.glassReason = `frame budget: ${root.dataset.glassMs} ms median`;
    return { mode: 'css', reason: root.dataset.glassReason };
  }

  root.classList.add('gl-glass');
  const ro = new ResizeObserver(() => { measure(); request(); });
  ro.observe(scene);
  ro.observe(panel);
  window.addEventListener('scroll', () => { measure(); request(); }, { passive: true });
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) request(); }).observe(scene);

  const dark = () => { uniforms.uLit.value = 0; request(); };
  panel.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') { dark(); return; }
    const s = scene.getBoundingClientRect();
    uniforms.uPointer.value.set(e.clientX - s.left, e.clientY - s.top);
    uniforms.uLit.value = 1;
    request();
  });
  panel.addEventListener('pointerleave', dark);
  panel.addEventListener('pointercancel', dark);

  // A preference flipped mid-visit drops straight back to the CSS glass.
  for (const q of ['(prefers-reduced-motion: reduce)', '(prefers-reduced-transparency: reduce)']) {
    window.matchMedia(q).addEventListener('change', (ev) => {
      if (!ev.matches) return;
      root.classList.remove('gl-glass');
      root.dataset.glass = 'css';
      root.dataset.glassReason = 'preference changed';
    });
  }

  request();
  return plan;
}
