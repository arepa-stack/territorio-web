// Everything you see in /jugar-v2: procedural PBR textures, the night street court, the hoop, the jointed
// players, lights and post-processing. No game logic here (rules: oneOnOne.js, poses/physics: render3d.js).
import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import C from './court-config.json'

export const BASE_X = C.rim.toBaseline // baseline, world x
export const BOARD_X = C.rim.toBaseline - C.backboard.toBaseline // backboard face, world x
export const RIM = new THREE.Vector3(0, C.rim.height, 0)

const rnd = (a, b) => a + Math.random() * (b - a)
const canvasOf = (w, h = w) => {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return [c, c.getContext('2d')]
}
const texOf = (c, srgb = true) => {
  const t = new THREE.CanvasTexture(c)
  if (srgb) t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}
const std = (color, extra) => new THREE.MeshStandardMaterial({ color, roughness: 0.75, ...extra })
const shadowed = m => {
  m.castShadow = true
  m.receiveShadow = true
  return m
}

// ---------- asphalt court: color + bump + roughness, all painted on canvases ----------
const X0 = -13 // the court textures cover x ∈ [-13, 3], z ∈ [-8, 8] at 128 px per meter (2048²)
const Z0 = -8
const PPM = 128
const cx = x => (x - X0) * PPM
const cz = z => (z - Z0) * PPM

// asphalt height field: fine grain, soft low-frequency unevenness, pebbles and a few cracks
function asphaltGrain(size) {
  const [c, g] = canvasOf(size)
  const img = g.createImageData(size, size)
  const d = img.data
  for (let i = 0; i < d.length; i += 4) {
    const v = 128 + (Math.random() - 0.5) * 120
    d[i] = d[i + 1] = d[i + 2] = v
    d[i + 3] = 255
  }
  g.putImageData(img, 0, 0)
  const [low, lg] = canvasOf(48)
  for (let x = 0; x < 48; x++) for (let y = 0; y < 48; y++) {
    lg.fillStyle = `rgba(${Math.random() < 0.5 ? '0,0,0' : '255,255,255'},${Math.random() * 0.28})`
    lg.fillRect(x, y, 1, 1)
  }
  g.imageSmoothingEnabled = true
  g.drawImage(low, 0, 0, size, size)
  for (let i = 0; i < size * 4; i++) {
    g.fillStyle = Math.random() < 0.5 ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'
    g.beginPath()
    g.arc(Math.random() * size, Math.random() * size, rnd(0.8, 2.6), 0, 7)
    g.fill()
  }
  g.strokeStyle = 'rgba(0,0,0,0.85)'
  g.lineCap = 'round'
  for (let i = 0; i < 16; i++) {
    let x = Math.random() * size
    let y = Math.random() * size
    let a = Math.random() * Math.PI * 2
    g.lineWidth = rnd(1.5, 3.5)
    g.beginPath()
    g.moveTo(x, y)
    for (let k = 0; k < rnd(12, 40); k++) {
      a += rnd(-0.6, 0.6)
      x += Math.cos(a) * rnd(8, 22)
      y += Math.sin(a) * rnd(8, 22)
      g.lineTo(x, y)
    }
    g.stroke()
  }
  return c
}

// court markings; `pal` lets the same drawing feed the color map and the roughness map
function paintLines(g, pal) {
  const half = C.halfCourt.width / 2
  const midX = BASE_X - C.halfCourt.length
  const keyX = BASE_X - C.key.length
  if (pal.court) {
    g.fillStyle = pal.court
    g.fillRect(cx(midX), cz(-half), C.halfCourt.length * PPM, C.halfCourt.width * PPM)
  }
  g.fillStyle = pal.key
  g.fillRect(cx(keyX), cz(-C.key.width / 2), C.key.length * PPM, C.key.width * PPM)
  if (pal.logo) {
    g.save()
    g.translate(cx(-8.7), cz(0))
    g.rotate(Math.PI / 2) // letters run along z (screen right), their tops point to the hoop
    g.font = `${1.6 * PPM}px Anton, Impact, sans-serif`
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.fillStyle = pal.logo
    g.fillText('TURF.', 0, 0)
    g.restore()
  }
  g.strokeStyle = pal.line
  g.lineWidth = C.lineWidth * PPM
  g.strokeRect(cx(midX), cz(-half), C.halfCourt.length * PPM, C.halfCourt.width * PPM)
  g.strokeRect(cx(keyX), cz(-C.key.width / 2), C.key.length * PPM, C.key.width * PPM)
  const arc = (x, z, r, a0, a1, dash) => {
    g.setLineDash(dash ? [24, 24] : [])
    g.beginPath()
    g.arc(cx(x), cz(z), r * PPM, a0, a1)
    g.stroke()
  }
  arc(keyX, 0, C.freeThrowCircle, Math.PI / 2, Math.PI * 1.5)
  arc(keyX, 0, C.freeThrowCircle, -Math.PI / 2, Math.PI / 2, true)
  arc(0, 0, C.restrictedArea, Math.PI / 2, Math.PI * 1.5)
  arc(midX, 0, C.centerCircle, -Math.PI / 2, Math.PI / 2)
  g.setLineDash([])
  const r3 = C.threePoint.radius
  const z3 = C.threePoint.cornerZ
  const xj = -Math.sqrt(r3 * r3 - z3 * z3)
  const a = Math.atan2(z3, xj)
  g.beginPath()
  g.moveTo(cx(BASE_X), cz(z3))
  g.lineTo(cx(xj), cz(z3))
  g.arc(cx(0), cz(0), r3 * PPM, a, Math.PI * 2 - a)
  g.lineTo(cx(BASE_X), cz(-z3))
  g.stroke()
}

function courtMaterial() {
  const size = 16 * PPM
  const grain = asphaltGrain(size)
  // color: dark asphalt with worn paint (the grain shows through the paint)
  const [col, g] = canvasOf(size)
  g.fillStyle = '#2b2a27'
  g.fillRect(0, 0, size, size)
  paintLines(g, { court: 'rgba(84,80,70,0.55)', key: 'rgba(214,66,16,0.78)', logo: 'rgba(255,79,18,0.34)', line: '#d9d4c8' })
  g.globalCompositeOperation = 'multiply'
  g.globalAlpha = 0.55
  g.drawImage(grain, 0, 0)
  g.globalCompositeOperation = 'source-over'
  // stains and worn patches
  for (let i = 0; i < 26; i++) {
    const x = Math.random() * size
    const y = Math.random() * size
    const r = rnd(60, 260)
    const grad = g.createRadialGradient(x, y, 0, x, y, r)
    grad.addColorStop(0, `rgba(0,0,0,${rnd(0.1, 0.3)})`)
    grad.addColorStop(1, 'rgba(0,0,0,0)')
    g.globalAlpha = 1
    g.fillStyle = grad
    g.fillRect(x - r, y - r, r * 2, r * 2)
  }
  // roughness: rough asphalt, smoother paint and smoother polished patches where people play
  const [rough, rg] = canvasOf(size)
  rg.fillStyle = '#e2e2e2'
  rg.fillRect(0, 0, size, size)
  rg.globalAlpha = 0.4
  rg.drawImage(grain, 0, 0)
  rg.globalAlpha = 1
  paintLines(rg, { key: 'rgba(120,120,120,0.75)', line: '#6e6e6e' })
  for (let i = 0; i < 14; i++) {
    const x = cx(rnd(-7, 0.5))
    const y = cz(rnd(-4, 4))
    const r = rnd(90, 300)
    const grad = rg.createRadialGradient(x, y, 0, x, y, r)
    grad.addColorStop(0, 'rgba(95,95,95,0.5)')
    grad.addColorStop(1, 'rgba(95,95,95,0)')
    rg.fillStyle = grad
    rg.fillRect(x - r, y - r, r * 2, r * 2)
  }
  return new THREE.MeshStandardMaterial({
    map: texOf(col),
    bumpMap: texOf(grain, false),
    bumpScale: 1.4,
    roughnessMap: texOf(rough, false),
    roughness: 1,
    metalness: 0
  })
}

// ---------- ball: pebbled leather ----------
function ballMaterial() {
  const [col, g] = canvasOf(1024, 512)
  const [bump, b] = canvasOf(1024, 512)
  g.fillStyle = '#c9561a'
  g.fillRect(0, 0, 1024, 512)
  b.fillStyle = '#6e6e6e'
  b.fillRect(0, 0, 1024, 512)
  for (let i = 0; i < 26000; i++) {
    const x = Math.random() * 1024
    const y = Math.random() * 512
    const r = rnd(1.6, 2.6)
    b.fillStyle = 'rgba(255,255,255,0.75)'
    b.beginPath()
    b.arc(x, y, r, 0, 7)
    b.fill()
    g.fillStyle = `rgba(${Math.random() < 0.5 ? '255,190,130' : '60,20,0'},0.09)`
    g.beginPath()
    g.arc(x, y, r, 0, 7)
    g.fill()
  }
  const seams = (ctx, style, w) => {
    ctx.strokeStyle = style
    ctx.lineWidth = w
    ctx.beginPath()
    ctx.moveTo(0, 256)
    ctx.lineTo(1024, 256)
    for (const u of [256, 768]) {
      ctx.moveTo(u, 0)
      ctx.lineTo(u, 512)
    }
    ctx.stroke()
    for (const s of [1, -1]) {
      ctx.beginPath()
      for (let u = 0; u <= 1024; u += 8) ctx.lineTo(u, 256 + s * 180 * Math.cos((u / 1024) * Math.PI * 2))
      ctx.stroke()
    }
  }
  seams(g, '#120a06', 11)
  seams(b, '#000000', 14) // seams are grooves
  return new THREE.MeshStandardMaterial({ map: texOf(col), bumpMap: texOf(bump, false), bumpScale: 2.2, roughness: 0.62, metalness: 0 })
}

// ---------- hoop ----------
function boardMarkings() {
  const b = C.backboard
  const s = 512 / b.width
  const [c, g] = canvasOf(512, Math.round(b.height * s))
  g.strokeStyle = '#ffffff'
  g.lineWidth = 0.05 * s
  g.strokeRect(g.lineWidth / 2, g.lineWidth / 2, c.width - g.lineWidth, c.height - g.lineWidth)
  // shooter's square: 0.59 × 0.45, its bottom edge level with the rim
  const rimY = c.height - (C.rim.height - b.bottom) * s
  g.strokeRect(c.width / 2 - 0.295 * s, rimY - 0.45 * s, 0.59 * s, 0.45 * s)
  return texOf(c)
}

// net = diamond mesh of lines whose vertices follow a damped spring (stretch + sway)
function makeNet() {
  const N = 12
  const R = 6
  const LEN = 0.42
  const pos = new Float32Array((R + 1) * N * 3)
  const idx = []
  for (let r = 0; r < R; r++) for (let c = 0; c < N; c++) {
    const a = r * N + c
    idx.push(a, (r + 1) * N + c, a, (r + 1) * N + ((c + (r % 2 ? 1 : N - 1)) % N))
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  geo.setIndex(idx)
  const mesh = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: '#e9e4d8', transparent: true, opacity: 0.9 }))
  mesh.frustumCulled = false
  const st = { s: 0, vs: 0, x: 0, vx: 0, z: 0, vz: 0, t: 0 }
  function update(dt) {
    st.t += dt
    for (const [p, v, k, damp] of [['s', 'vs', 260, 7], ['x', 'vx', 120, 3.2], ['z', 'vz', 120, 3.2]]) {
      st[v] += (-st[p] * k - st[v] * damp) * dt
      st[p] += st[v] * dt
    }
    for (let r = 0; r <= R; r++) {
      const t = r / R
      const rad = (C.rim.radius + (0.115 - C.rim.radius) * Math.pow(t, 0.75)) * (1 - 0.35 * Math.max(0, st.s) * Math.sin(Math.PI * t))
      const y = -t * LEN * (1 + st.s * 0.9)
      const ripple = Math.sin(t * 7 - st.t * 22) * 0.012 * Math.min(1, Math.abs(st.vs) + Math.abs(st.vx) + Math.abs(st.vz)) * t
      for (let c = 0; c < N; c++) {
        const a = ((c + (r % 2) * 0.5) / N) * Math.PI * 2
        const i = (r * N + c) * 3
        pos[i] = Math.cos(a) * (rad + ripple) + st.x * t * t
        pos[i + 1] = y
        pos[i + 2] = Math.sin(a) * (rad + ripple) + st.z * t * t
      }
    }
    geo.attributes.position.needsUpdate = true
  }
  update(0)
  return {
    mesh,
    update,
    swish: () => (st.vs += 7), // ball drops through: pulled down, then snaps back
    kick(k, dx = rnd(-1, 1), dz = rnd(-1, 1)) {
      st.vx += dx * k * 1.6
      st.vz += dz * k * 1.6
      st.vs += k * 1.2
    }
  }
}

export function buildHoop(scene) {
  const metal = std('#2b2d31', { metalness: 0.85, roughness: 0.35 })
  const poleX = BASE_X + 1
  const pole = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 3.5, 20), metal))
  pole.position.set(poleX, 1.75, 0)
  const foot = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.34, 0.12, 20), metal))
  foot.position.set(poleX, 0.06, 0)
  const arm = shadowed(new THREE.Mesh(new THREE.BoxGeometry(poleX - BOARD_X, 0.12, 0.12), metal))
  arm.position.set((poleX + BOARD_X) / 2, 3.38, 0)
  const brace = shadowed(new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.06, 0.06), metal))
  brace.position.set(BOARD_X + 0.62, 3.05, 0)
  brace.rotation.z = -0.5
  const b = C.backboard
  const cy = b.bottom + b.height / 2
  // acrylic board: see-through, glossy, with a dark metal frame and crisp white markings
  const glass = new THREE.Mesh(
    new THREE.BoxGeometry(b.thickness * 0.5, b.height, b.width),
    new THREE.MeshPhysicalMaterial({ color: '#cfe4ee', transparent: true, opacity: 0.2, roughness: 0.04, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.03, specularIntensity: 1, depthWrite: false })
  )
  glass.position.set(BOARD_X + b.thickness / 2, cy, 0)
  const frame = new THREE.Group()
  const t = 0.05
  for (const [h, w, y, z] of [[t, b.width + t, cy + b.height / 2, 0], [t, b.width + t, cy - b.height / 2, 0], [b.height + t, t, cy, b.width / 2], [b.height + t, t, cy, -b.width / 2]]) {
    const bar = shadowed(new THREE.Mesh(new THREE.BoxGeometry(b.thickness * 1.3, h, w), metal))
    bar.position.set(BOARD_X + b.thickness / 2, y, z)
    frame.add(bar)
  }
  const marks = new THREE.Mesh(new THREE.PlaneGeometry(b.width, b.height), new THREE.MeshBasicMaterial({ map: boardMarkings(), transparent: true, depthWrite: false, side: THREE.DoubleSide }))
  marks.rotation.y = -Math.PI / 2
  marks.position.set(BOARD_X - 0.004, cy, 0)
  // rim (slightly emissive so the bloom catches it), neck and net hang from a pivot so a dunk can bend them
  const rimMat = std('#ff4f12', { metalness: 0.6, roughness: 0.3, emissive: '#ff3a00', emissiveIntensity: 0.55 })
  const rim = shadowed(new THREE.Mesh(new THREE.TorusGeometry(C.rim.radius, C.rim.tube * 1.5, 12, 48), rimMat))
  rim.rotation.x = Math.PI / 2
  const flex = new THREE.Group()
  flex.position.set(BOARD_X, RIM.y, 0)
  rim.position.set(RIM.x - BOARD_X, 0, 0)
  const neck = shadowed(new THREE.Mesh(new THREE.BoxGeometry(BOARD_X - C.rim.radius, 0.03, 0.09), rimMat))
  neck.position.set((C.rim.radius - BOARD_X) / 2, 0, 0)
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.14, 0.16), rimMat)
  plate.position.set(-0.012, -0.03, 0)
  const net = makeNet()
  net.mesh.position.set(RIM.x - BOARD_X, 0, 0)
  flex.add(rim, neck, plate, net.mesh)
  scene.add(pole, foot, arm, brace, glass, frame, marks, flex)
  return { net, flex }
}

// ---------- players: jointed mannequins (hips, knees, shoulders, elbows) until the .glb models arrive ----------
function numberTexture(num) {
  const [c, g] = canvasOf(128)
  g.font = '96px Anton, Impact, sans-serif'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillStyle = '#ffffff'
  g.fillText(num, 64, 70)
  return texOf(c)
}

// Proportions of a 1.95 m player: long legs (hip at 1.03), short tapered torso, wide shoulders, long arms.
// render3d.js poses these joints and relies on RIG for reach and leg length.
export const RIG = { shoulder: 1.6, arm: 0.72, leg: 1.0, thigh: 0.5 }

export function makePlayer({ jersey, shorts, skin, num, headband, shoe = '#16181c' }) {
  const root = new THREE.Group()
  const body = new THREE.Group()
  root.add(body)
  const skinMat = std(skin, { roughness: 0.55 })
  const jerseyMat = std(jersey, { roughness: 0.85, side: THREE.DoubleSide })
  const shortsMat = std(shorts, { roughness: 0.9 })
  const add = (parent, mesh, x = 0, y = 0, z = 0) => {
    mesh.position.set(x, y, z)
    parent.add(shadowed(mesh))
    return mesh
  }
  const lathe = (pts, mat) => new THREE.Mesh(new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), 22), mat)

  // sleeveless jersey: loose hem, narrow waist, chest and shoulders wider (flattened front to back)
  add(body, lathe([[0.17, 1.0], [0.2, 1.02], [0.178, 1.2], [0.2, 1.4], [0.235, 1.53], [0.2, 1.63], [0.085, 1.665]], jerseyMat)).scale.set(0.8, 1, 1.08)
  const trim = add(body, new THREE.Mesh(new THREE.TorusGeometry(0.082, 0.012, 8, 24), std('#ffffff')), 0, 1.665, 0)
  trim.rotation.x = Math.PI / 2
  add(body, new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.058, 0.15, 14), skinMat), 0, 1.73, 0) // neck
  add(body, new THREE.Mesh(new THREE.SphereGeometry(0.105, 22, 18), skinMat), 0, 1.875, 0).scale.set(1, 1.16, 0.92)
  add(body, new THREE.Mesh(new THREE.SphereGeometry(0.11, 22, 12, 0, Math.PI * 2, 0, Math.PI * 0.42), std('#17120e', { roughness: 0.95 })), -0.006, 1.895, 0).scale.set(1, 1.14, 0.93) // hair
  if (headband) {
    const band = add(body, new THREE.Mesh(new THREE.TorusGeometry(0.102, 0.018, 8, 28), std(headband)), 0, 1.93, 0)
    band.rotation.x = Math.PI / 2
  }
  // number on the chest and on the back (the camera sits behind the ball handler)
  const numMat = new THREE.MeshBasicMaterial({ map: numberTexture(num), transparent: true, depthWrite: false })
  for (const side of [1, -1]) {
    const n = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.26), numMat)
    n.position.set(side * 0.172, 1.36, 0)
    n.rotation.y = (side * Math.PI) / 2
    body.add(n)
  }
  // baggy shorts over the hips
  add(body, lathe([[0.185, 1.09], [0.215, 1.02], [0.22, 0.84], [0.09, 0.84]], shortsMat)).scale.set(0.85, 1, 1.05)

  const legs = []
  const knees = []
  const arms = []
  const elbows = []
  const THIGH = RIG.thigh
  const SHIN = RIG.leg - RIG.thigh - 0.03 // the sole takes the rest
  for (const side of [1, -1]) {
    // leg: hip pivot → thigh (shorts leg over it) → knee pivot → calf, sock and sneaker
    const hip = new THREE.Group()
    hip.position.set(0, 1.03, side * 0.105)
    body.add(hip)
    add(hip, new THREE.Mesh(new THREE.CapsuleGeometry(0.082, THIGH - 0.12, 4, 12), skinMat), 0, -THIGH / 2, 0)
    add(hip, new THREE.Mesh(new THREE.CylinderGeometry(0.108, 0.128, 0.32, 14), shortsMat), 0, -0.18, 0)
    const knee = new THREE.Group()
    knee.position.y = -THIGH
    hip.add(knee)
    add(knee, new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 10), skinMat))
    add(knee, new THREE.Mesh(new THREE.CapsuleGeometry(0.062, SHIN - 0.2, 4, 12), skinMat), -0.012, -SHIN / 2 + 0.03, 0).scale.set(1.12, 1, 1) // calf
    add(knee, new THREE.Mesh(new THREE.CylinderGeometry(0.056, 0.052, 0.15, 12), std('#f1f1ee')), 0, -SHIN + 0.14, 0) // sock
    // sneaker: white sole, upper, toe cap and a stripe
    add(knee, new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.035, 0.12), std('#f4f4f0', { roughness: 0.5 })), 0.055, -SHIN - 0.012, 0)
    add(knee, new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.1, 0.108), std(shoe, { roughness: 0.6 })), 0.01, -SHIN + 0.05, 0)
    add(knee, new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8), std(shoe, { roughness: 0.6 })), 0.125, -SHIN + 0.035, 0).scale.set(1.35, 0.8, 0.9)
    add(knee, new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.03, 0.112), std(jersey)), 0.03, -SHIN + 0.055, 0)
    legs.push(hip)
    knees.push(knee)

    // arm: shoulder pivot → upper arm → elbow pivot → forearm and hand
    const shoulder = new THREE.Group()
    shoulder.position.set(0, RIG.shoulder, side * 0.275)
    body.add(shoulder)
    add(shoulder, new THREE.Mesh(new THREE.SphereGeometry(0.085, 14, 10), skinMat)) // deltoid
    add(shoulder, new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.23, 4, 10), skinMat), 0, -0.175, 0)
    const elbow = new THREE.Group()
    elbow.position.y = -0.34
    shoulder.add(elbow)
    add(elbow, new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), skinMat))
    add(elbow, new THREE.Mesh(new THREE.CapsuleGeometry(0.043, 0.22, 4, 10), skinMat), 0, -0.16, 0)
    add(elbow, new THREE.Mesh(new THREE.SphereGeometry(0.056, 10, 8), skinMat), 0, -0.34, 0).scale.set(0.8, 1.2, 0.6) // hand
    add(elbow, new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.046, 0.05, 10), std(side > 0 ? jersey : '#f1f1ee')), 0, -0.24, 0) // wristband
    arms.push(shoulder)
    elbows.push(elbow)
  }
  return { root, body, legs, knees, arms, elbows }
}

// ---------- environment: court, fence, lamps with light shafts, city skyline ----------
function fenceMaterial(w, h) {
  const [c, g] = canvasOf(64)
  g.strokeStyle = '#ffffff'
  g.lineWidth = 3
  g.beginPath()
  g.moveTo(0, 0)
  g.lineTo(64, 64)
  g.moveTo(64, 0)
  g.lineTo(0, 64)
  g.stroke()
  const t = texOf(c, false)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(w * 3.2, h * 3.2)
  // galvanized wire: metallic, catches the lamps as highlights
  return new THREE.MeshStandardMaterial({ color: '#aab0b6', metalness: 0.8, roughness: 0.3, alphaMap: t, alphaTest: 0.35, side: THREE.DoubleSide })
}

function windowsTexture() {
  const [c, g] = canvasOf(128, 256)
  g.fillStyle = '#000'
  g.fillRect(0, 0, 128, 256)
  for (let row = 0; row < 16; row++) for (let col = 0; col < 8; col++) {
    if (Math.random() > 0.13) continue
    g.fillStyle = Math.random() < 0.7 ? `rgba(255,${rnd(190, 225) | 0},150,${rnd(0.35, 1)})` : `rgba(180,210,255,${rnd(0.3, 0.8)})`
    g.fillRect(col * 16 + 4, row * 16 + 4, 8, 9)
  }
  const t = texOf(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  return t
}

function skyTexture() {
  const [c, g] = canvasOf(1024, 512)
  const grad = g.createLinearGradient(0, 0, 0, 512)
  grad.addColorStop(0, '#03040a')
  grad.addColorStop(0.45, '#0a0f24')
  grad.addColorStop(0.72, '#231a33')
  grad.addColorStop(1, '#4a2f2a') // sodium-lamp glow of the city on the horizon
  g.fillStyle = grad
  g.fillRect(0, 0, 1024, 512)
  for (let i = 0; i < 220; i++) {
    g.fillStyle = `rgba(255,255,255,${rnd(0.2, 0.9)})`
    g.fillRect(Math.random() * 1024, Math.random() * 260, rnd(0.6, 1.6), rnd(0.6, 1.6))
  }
  return texOf(c)
}

function lightShaft(from, to, radius) {
  const [c, g] = canvasOf(8, 128)
  const grad = g.createLinearGradient(0, 0, 0, 128)
  grad.addColorStop(0, '#ffffff') // v = 1 at the apex (lamp), fading out toward the floor
  grad.addColorStop(0.5, '#3a3a3a')
  grad.addColorStop(1, '#000000')
  g.fillStyle = grad
  g.fillRect(0, 0, 8, 128)
  const len = from.distanceTo(to)
  const geo = new THREE.ConeGeometry(radius, len, 32, 1, true)
  geo.translate(0, -len / 2, 0) // apex at the origin
  const cone = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: '#ffd9a8', alphaMap: texOf(c, false), transparent: true, opacity: 0.02, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }))
  cone.position.copy(from)
  cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), to.clone().sub(from).normalize())
  return cone
}

export function buildEnvironment(scene) {
  scene.background = skyTexture()
  scene.fog = new THREE.FogExp2('#161624', 0.016)

  const court = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), courtMaterial())
  court.rotation.x = -Math.PI / 2
  court.position.set(X0 + 8, 0, Z0 + 8)
  court.receiveShadow = true
  // the rest of the lot: same asphalt grain, tiled
  const lotGrain = texOf(asphaltGrain(512), false)
  lotGrain.wrapS = lotGrain.wrapT = THREE.RepeatWrapping
  lotGrain.repeat.set(30, 30)
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), std('#1d1c1a', { roughness: 0.95, bumpMap: lotGrain, bumpScale: 1.2 }))
  ground.rotation.x = -Math.PI / 2
  ground.position.y = -0.006
  ground.receiveShadow = true
  scene.add(ground, court)

  // chain-link fence behind the court and behind the baseline
  const metal = std('#6b7076', { metalness: 0.8, roughness: 0.3 })
  const fence = (w, h, x, z, rotY) => {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), fenceMaterial(w, h))
    mesh.position.set(x, h / 2, z)
    mesh.rotation.y = rotY
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, w, 8), metal)
    rail.rotation.z = Math.PI / 2
    rail.rotation.y = rotY
    rail.position.set(x, h, z)
    scene.add(mesh, rail)
    for (let i = 0; i <= w; i += 3) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, h, 8), metal)
      const along = -w / 2 + i
      post.position.set(x + (rotY ? 0 : along), h / 2, z + (rotY ? along : 0))
      post.castShadow = true
      scene.add(post)
    }
  }
  fence(24, 3.8, -6, -9.5, 0)
  fence(24, 3.8, -6, 9.5, 0)
  fence(19, 3.8, BASE_X + 2.6, 0, Math.PI / 2)

  // two halogen street lamps in the corners behind the baseline, leaning over the court:
  // spot light with soft shadows, glowing head and a faint light shaft
  for (const [z, color] of [[-7, '#ffd4a3'], [7, '#ffe2bd']]) {
    const px = BASE_X + 2.2
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 7.8, 12), metal)
    pole.position.set(px, 3.9, z)
    const arm = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.08, 0.08), metal)
    arm.position.set(px - 0.7, 7.75, z)
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.14, 0.5), metal)
    head.position.set(px - 1.4, 7.72, z)
    const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.03, 0.38), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffe3bb').multiplyScalar(9) }))
    bulb.position.set(px - 1.4, 7.635, z)
    const from = new THREE.Vector3(px - 1.4, 7.6, z)
    const to = new THREE.Vector3(-4.5, 0, z * 0.3)
    const spot = new THREE.SpotLight(color, 620, 40, 0.95, 0.6, 1.6)
    spot.position.copy(from)
    spot.target.position.copy(to)
    spot.castShadow = true
    spot.shadow.mapSize.set(2048, 2048)
    spot.shadow.camera.near = 2
    spot.shadow.camera.far = 36
    spot.shadow.bias = -0.0005
    spot.shadow.normalBias = 0.03
    scene.add(pole, arm, head, bulb, spot, spot.target, lightShaft(from, to, 5.5))
  }
  // cold night ambience + a soft fill from the camera side so the players never go black
  scene.add(new THREE.HemisphereLight('#44528a', '#17130f', 0.55))
  const fill = new THREE.DirectionalLight('#a9b8ee', 0.95)
  fill.position.set(-18, 11, 3) // from behind the camera
  scene.add(fill)

  // city blocks behind the fences: dark boxes with random lit windows
  const wins = [windowsTexture(), windowsTexture(), windowsTexture()]
  const block = (x, z, w, d, h) => {
    const t = wins[(Math.random() * wins.length) | 0].clone()
    t.repeat.set(Math.max(1, Math.round(w / 3)), Math.max(1, Math.round(h / 5)))
    t.offset.set(Math.random(), Math.random())
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), std('#0c0e15', { roughness: 0.95, emissive: '#ffffff', emissiveMap: t, emissiveIntensity: 0.5 }))
    m.position.set(x, h / 2, z)
    scene.add(m)
  }
  // main backdrop behind the hoop: a near row and a taller far row
  for (let z = -42; z < 42; ) {
    const d = rnd(6, 11)
    block(rnd(13, 16), z + d / 2, 8, d, rnd(6, 13))
    if (Math.random() < 0.7) block(rnd(27, 33), z + d / 2 + rnd(-2, 2), 9, d * 1.3, rnd(14, 28))
    z += d + rnd(0.6, 2.2)
  }
  // both sides, closing the corners
  for (const side of [-1, 1]) for (let x = -26; x < 10; ) {
    const w = rnd(6, 11)
    block(x + w / 2, side * rnd(17, 21), w, 8, rnd(5, 12))
    x += w + rnd(0.6, 2.5)
  }
}

// ---------- post-processing: bloom only on what is really bright (lamps, rim, windows) ----------
export function createComposer(gl, scene, camera) {
  const target = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: 4 })
  const composer = new EffectComposer(gl, target)
  composer.addPass(new RenderPass(scene, camera))
  const bloom = new UnrealBloomPass(new THREE.Vector2(4, 4), 0.5, 0.55, 1.6) // strength, radius, threshold (HDR, before tone mapping)
  composer.addPass(bloom)
  composer.addPass(new OutputPass())
  return { composer, bloom }
}

export function makeBall() {
  return shadowed(new THREE.Mesh(new THREE.SphereGeometry(C.ball.radius, 40, 28), ballMaterial()))
}
