// Everything you see in /jugar-v2: procedural PBR textures, the night street court, the hoop, the jointed
// players, lights and post-processing. No game logic here (rules: oneOnOne.js, poses/physics: render3d.js).
import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'
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
  const worn = (x, z, r, a) => {
    const grad = rg.createRadialGradient(cx(x), cz(z), 0, cx(x), cz(z), r * PPM)
    grad.addColorStop(0, `rgba(58,58,58,${a})`)
    grad.addColorStop(1, 'rgba(58,58,58,0)')
    rg.fillStyle = grad
    rg.fillRect(cx(x - r), cz(z - r), r * 2 * PPM, r * 2 * PPM)
  }
  for (let i = 0; i < 16; i++) worn(rnd(BASE_X - C.key.length, BASE_X - 0.5), rnd(-C.key.width / 2, C.key.width / 2), rnd(0.5, 1.5), rnd(0.35, 0.7))
  for (let i = 0; i < 22; i++) {
    const a = rnd(Math.PI * 0.55, Math.PI * 1.45)
    const r = C.threePoint.radius + rnd(-0.7, 0.9)
    worn(Math.cos(a) * r, Math.sin(a) * r, rnd(0.5, 1.3), rnd(0.3, 0.6))
  }
  return new THREE.MeshStandardMaterial({
    envMapIntensity: 0.9,
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

// net = rope links simulated with Verlet integration: top row pinned to the rim, gravity, a little wind,
// and real collision with the ball (it bulges and drags as the ball squeezes through)
function makeNet() {
  const N = 14
  const R = 7
  const LEN = 0.45
  const count = (R + 1) * N
  const pos = new Float32Array(count * 3)
  const prev = new Float32Array(count * 3)
  const rest = (r, c) => {
    const t = r / R
    const rad = C.rim.radius + (0.1 - C.rim.radius) * Math.pow(t, 0.75)
    const a = ((c + (r % 2) * 0.5) / N) * Math.PI * 2
    return [Math.cos(a) * rad, -t * LEN, Math.sin(a) * rad]
  }
  for (let r = 0; r <= R; r++) for (let c = 0; c < N; c++) pos.set(rest(r, c), (r * N + c) * 3)
  prev.set(pos)
  const dist = (a, b) => Math.hypot(pos[a * 3] - pos[b * 3], pos[a * 3 + 1] - pos[b * 3 + 1], pos[a * 3 + 2] - pos[b * 3 + 2])
  const ropes = [] // diamond links: can go slack, never stretch
  const hoops = [] // links around each row keep the tube shape
  const idx = []
  for (let r = 0; r < R; r++) for (let c = 0; c < N; c++) {
    const a = r * N + c
    for (const b of [(r + 1) * N + c, (r + 1) * N + ((c + (r % 2 ? 1 : N - 1)) % N)]) {
      ropes.push([a, b, dist(a, b)])
      idx.push(a, b)
    }
  }
  for (let r = 1; r <= R; r++) for (let c = 0; c < N; c++) hoops.push([r * N + c, r * N + ((c + 1) % N), dist(r * N + c, r * N + ((c + 1) % N))])
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  geo.setIndex(idx)
  const mesh = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: '#e9e4d8', transparent: true, opacity: 0.9 }))
  mesh.frustumCulled = false

  const ballLocal = new THREE.Vector3()
  const BALL = C.ball.radius + 0.012
  let clock = 0
  let flip = -1 // countdown to the upward snap after a swish
  const solve = (a, b, len, rope) => {
    const ax = a * 3
    const bx = b * 3
    const dx = pos[bx] - pos[ax]
    const dy = pos[bx + 1] - pos[ax + 1]
    const dz = pos[bx + 2] - pos[ax + 2]
    const d = Math.hypot(dx, dy, dz) || 1e-6
    if (rope && d <= len) return
    const k = (d - len) / d
    const wa = a < N ? 0 : b < N ? 1 : 0.5 // the top row is tied to the rim
    const wb = b < N ? 0 : a < N ? 1 : 0.5
    pos[ax] += dx * k * wa
    pos[ax + 1] += dy * k * wa
    pos[ax + 2] += dz * k * wa
    pos[bx] -= dx * k * wb
    pos[bx + 1] -= dy * k * wb
    pos[bx + 2] -= dz * k * wb
  }
  function step(h, ball) {
    clock += h
    for (let i = N; i < count; i++) {
      const j = i * 3
      const t = Math.floor(i / N) / R
      const wind = Math.sin(clock * 1.3 + t * 2) * 0.35 * t
      for (let k = 0; k < 3; k++) {
        const p = pos[j + k]
        const acc = k === 1 ? -5.5 : k === 2 ? wind : wind * 0.4
        pos[j + k] = p + (p - prev[j + k]) * 0.982 + acc * h * h
        prev[j + k] = p
      }
    }
    for (let it = 0; it < 4; it++) {
      for (const [a, b, len] of ropes) solve(a, b, len, true)
      for (const [a, b, len] of hoops) solve(a, b, len, false)
      if (ball) for (let i = N; i < count; i++) {
        const j = i * 3
        const dx = pos[j] - ball.x
        const dy = pos[j + 1] - ball.y
        const dz = pos[j + 2] - ball.z
        const d = Math.hypot(dx, dy, dz)
        if (d < BALL && d > 1e-5) {
          const k = BALL / d
          pos[j] = ball.x + dx * k
          pos[j + 1] = ball.y + dy * k
          pos[j + 2] = ball.z + dz * k
        }
      }
    }
  }
  return {
    mesh,
    update(dt, ballWorld) {
      const ball = ballWorld ? mesh.worldToLocal(ballLocal.copy(ballWorld)) : null
      const near = ball && ball.lengthSq() < 1 ? ball : null
      const steps = Math.min(4, Math.max(1, Math.round(dt / (1 / 120))))
      for (let i = 0; i < steps; i++) step(dt / steps, near)
      if (flip > 0 && (flip -= dt) <= 0) for (let i = N; i < count; i++) prev[i * 3 + 1] -= 0.03 * (Math.floor(i / N) / R) // snaps up after the ball leaves
      geo.attributes.position.needsUpdate = true
    },
    swish: () => (flip = 0.16),
    kick(k, dx = rnd(-1, 1), dz = rnd(-1, 1)) {
      for (let i = N; i < count; i++) {
        const t = Math.floor(i / N) / R
        prev[i * 3] -= dx * k * 0.012 * t
        prev[i * 3 + 2] -= dz * k * 0.012 * t
        prev[i * 3 + 1] -= k * 0.006 * t
      }
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
  // everything hanging off the pole (arm, board, rim, net) shakes together around the top of the pole
  const PIVOT = new THREE.Vector3(poleX, 3.38, 0)
  const rig = new THREE.Group()
  rig.position.copy(PIVOT)
  const hang = (obj, x, y, z) => {
    obj.position.set(x - PIVOT.x, y - PIVOT.y, z - PIVOT.z)
    rig.add(obj)
    return obj
  }
  hang(shadowed(new THREE.Mesh(new THREE.BoxGeometry(poleX - BOARD_X, 0.12, 0.12), metal)), (poleX + BOARD_X) / 2, 3.38, 0)
  hang(shadowed(new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.06, 0.06), metal)), BOARD_X + 0.62, 3.05, 0).rotation.z = -0.5
  const b = C.backboard
  const cy = b.bottom + b.height / 2
  // acrylic board: see-through, glossy (it mirrors the night around it), dark metal frame, crisp white markings
  hang(new THREE.Mesh(
    new THREE.BoxGeometry(b.thickness * 0.5, b.height, b.width),
    new THREE.MeshPhysicalMaterial({ color: '#cfe4ee', transparent: true, opacity: 0.22, roughness: 0.03, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.02, specularIntensity: 1, envMapIntensity: 1.6, depthWrite: false })
  ), BOARD_X + b.thickness / 2, cy, 0)
  const t = 0.05
  for (const [h, w, y, z] of [[t, b.width + t, cy + b.height / 2, 0], [t, b.width + t, cy - b.height / 2, 0], [b.height + t, t, cy, b.width / 2], [b.height + t, t, cy, -b.width / 2]]) {
    hang(shadowed(new THREE.Mesh(new THREE.BoxGeometry(b.thickness * 1.3, h, w), metal)), BOARD_X + b.thickness / 2, y, z)
  }
  const marks = hang(new THREE.Mesh(new THREE.PlaneGeometry(b.width, b.height), new THREE.MeshBasicMaterial({ map: boardMarkings(), transparent: true, depthWrite: false, side: THREE.DoubleSide })), BOARD_X - 0.004, cy, 0)
  marks.rotation.y = -Math.PI / 2
  // steel support behind the board: two struts fanning out to its top corners, plus a back plate
  for (const side of [-1, 1]) {
    const to = new THREE.Vector3(BOARD_X + b.thickness, cy + b.height / 2 - 0.05, side * (b.width / 2 - 0.08))
    const strut = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, PIVOT.distanceTo(to), 8), metal))
    strut.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), to.clone().sub(PIVOT).normalize())
    const mid = PIVOT.clone().lerp(to, 0.5)
    hang(strut, mid.x, mid.y, mid.z)
  }
  hang(shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.5, 0.62), metal)), BOARD_X + b.thickness + 0.02, RIM.y + 0.16, 0)
  // steel rim (slightly emissive so the bloom catches it), neck and net on their own pivot so a dunk can bend them
  const rimMat = std('#ff4f12', { metalness: 0.75, roughness: 0.28, emissive: '#ff3a00', emissiveIntensity: 0.5 })
  const rim = shadowed(new THREE.Mesh(new THREE.TorusGeometry(C.rim.radius, C.rim.tube * 1.5, 12, 48), rimMat))
  rim.rotation.x = Math.PI / 2
  const flex = hang(new THREE.Group(), BOARD_X, RIM.y, 0)
  rim.position.set(RIM.x - BOARD_X, 0, 0)
  const neck = shadowed(new THREE.Mesh(new THREE.BoxGeometry(BOARD_X - C.rim.radius, 0.03, 0.09), rimMat))
  neck.position.set((C.rim.radius - BOARD_X) / 2, 0, 0)
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.14, 0.16), rimMat)
  plate.position.set(-0.012, -0.03, 0)
  const net = makeNet()
  net.mesh.position.set(RIM.x - BOARD_X, 0, 0)
  flex.add(rim, neck, plate, net.mesh)
  scene.add(pole, foot, rig)

  // damped spring: the whole assembly rocks after a dunk or a hard hit on the iron
  const s = { a: 0, va: 0, b: 0, vb: 0 }
  return {
    net,
    flex,
    board: {
      kick(k) {
        s.va += k * 0.55
        s.vb += rnd(-1, 1) * k * 0.25
      },
      update(dt) {
        s.va += (-s.a * 900 - s.va * 7) * dt
        s.a += s.va * dt
        s.vb += (-s.b * 700 - s.vb * 6) * dt
        s.b += s.vb * dt
        rig.rotation.set(0, s.b, s.a)
      }
    }
  }
}

// ---------- players: jointed mannequins (hips, knees, shoulders, elbows) until the .glb models arrive ----------
// athletic mesh fabric: rows of tiny holes
function fabric(rx, ry) {
  const [c, g] = canvasOf(64)
  g.fillStyle = '#b0b0b0'
  g.fillRect(0, 0, 64, 64)
  g.fillStyle = '#202020'
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
    g.beginPath()
    g.arc(x * 8 + (y % 2 ? 6 : 2), y * 8 + 4, 1.7, 0, 7)
    g.fill()
  }
  const t = texOf(c, false)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(rx, ry)
  return t
}

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
  const skinMat = new THREE.MeshPhysicalMaterial({ color: skin, roughness: 0.4, clearcoat: 0.15, clearcoatRoughness: 0.35 }) // sweat sheen
  const jerseyMat = std(jersey, { roughness: 0.8, side: THREE.DoubleSide, bumpMap: fabric(9, 14), bumpScale: 0.8 })
  const shortsMat = std(shorts, { roughness: 0.85, bumpMap: fabric(9, 6), bumpScale: 0.8 })
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

// facade: floors of small windows, a few lit, so a block reads as a building and not as dots
function windowsTexture() {
  const [c, g] = canvasOf(128, 256)
  g.fillStyle = '#000'
  g.fillRect(0, 0, 128, 256)
  for (let row = 0; row < 16; row++) {
    const floorLit = Math.random() < 0.85
    for (let col = 0; col < 8; col++) {
      const lit = floorLit && Math.random() < 0.24
      g.fillStyle = lit ? (Math.random() < 0.75 ? `rgba(255,${rnd(185, 225) | 0},140,${rnd(0.45, 1)})` : `rgba(170,205,255,${rnd(0.35, 0.8)})`) : 'rgba(70,80,110,0.10)'
      g.fillRect(col * 16 + 4, row * 16 + 5, 8, 7)
    }
  }
  const t = texOf(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  return t
}

// screen-space sky: the city glow sits where the horizon falls for the game camera (upper third)
function skyTexture() {
  const [c, g] = canvasOf(1024, 512)
  const grad = g.createLinearGradient(0, 0, 0, 512)
  grad.addColorStop(0, '#04050c')
  grad.addColorStop(0.07, '#0a1130')
  grad.addColorStop(0.16, '#262345')
  grad.addColorStop(0.25, '#57393a') // sodium-lamp haze over the city
  grad.addColorStop(1, '#57393a')
  g.fillStyle = grad
  g.fillRect(0, 0, 1024, 512)
  for (let i = 0; i < 160; i++) {
    g.fillStyle = `rgba(255,255,255,${rnd(0.2, 0.85)})`
    g.fillRect(Math.random() * 1024, Math.random() * 50, rnd(0.6, 1.5), rnd(0.6, 1.5))
  }
  return texOf(c)
}

// lit night haze under a lamp: brightest along the axis, fading to nothing at the silhouette and toward the floor
function lightShaft(from, to, radius) {
  const len = from.distanceTo(to)
  const geo = new THREE.ConeGeometry(radius, len, 48, 1, true)
  geo.translate(0, -len / 2, 0) // apex at the origin
  const mat = new THREE.ShaderMaterial({
    uniforms: { color: { value: new THREE.Color('#ffd9a8') }, opacity: { value: 0.1 } },
    vertexShader: `
      varying vec3 vN; varying vec3 vV; varying float vH;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal);
        vV = normalize(-mv.xyz);
        vH = uv.y; // 1 at the lamp, 0 at the floor
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform vec3 color; uniform float opacity;
      varying vec3 vN; varying vec3 vV; varying float vH;
      void main() {
        float facing = abs(dot(normalize(vN), normalize(vV)));
        float edge = smoothstep(0.0, 0.85, facing); // soft silhouette instead of a hard triangle
        float fall = smoothstep(0.0, 0.55, vH) * (0.35 + 0.65 * vH);
        gl_FragColor = vec4(color, opacity * edge * edge * fall);
      }`,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide
  })
  const cone = new THREE.Mesh(geo, mat)
  cone.position.copy(from)
  cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), to.clone().sub(from).normalize())
  return cone
}

// possession ring on the floor under the ball handler, with a chevron pointing at the hoop
export function makeRing() {
  const [c, g] = canvasOf(256)
  g.strokeStyle = '#fff'
  g.shadowColor = '#fff'
  g.shadowBlur = 14
  g.lineWidth = 9
  g.beginPath()
  g.arc(128, 128, 78, 0.5, Math.PI * 2 - 0.5) // open toward the chevron
  g.stroke()
  g.lineWidth = 8
  g.lineJoin = 'round'
  for (const x of [200, 222]) {
    g.beginPath()
    g.moveTo(x, 104)
    g.lineTo(x + 22, 128)
    g.lineTo(x, 152)
    g.stroke()
  }
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.7), new THREE.MeshBasicMaterial({ map: texOf(c), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }))
  mesh.rotation.x = -Math.PI / 2
  const ring = new THREE.Group()
  ring.add(mesh)
  ring.position.y = 0.02
  return { ring, material: mesh.material }
}

// burst of embers on the rim for a perfect-release make
export function makeFire() {
  const N = 70
  const [c, g] = canvasOf(64)
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  grad.addColorStop(0, 'rgba(255,255,255,1)')
  grad.addColorStop(0.4, 'rgba(255,170,60,0.7)')
  grad.addColorStop(1, 'rgba(255,60,0,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, 64, 64)
  const pos = new Float32Array(N * 3)
  const vel = new Float32Array(N * 3)
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  const mat = new THREE.PointsMaterial({ map: texOf(c), size: 0.42, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, color: new THREE.Color('#ff8a2a').multiplyScalar(3) })
  const points = new THREE.Points(geo, mat)
  points.frustumCulled = false
  let life = 0
  return {
    points,
    burst() {
      life = 1
      for (let i = 0; i < N; i++) {
        const a = Math.random() * Math.PI * 2
        pos.set([RIM.x + Math.cos(a) * C.rim.radius, RIM.y, RIM.z + Math.sin(a) * C.rim.radius], i * 3)
        vel.set([Math.cos(a) * rnd(0.1, 0.9), rnd(1.2, 3.4), Math.sin(a) * rnd(0.1, 0.9)], i * 3)
      }
    },
    update(dt) {
      if (life <= 0) return
      life = Math.max(0, life - dt / 0.9)
      for (let i = 0; i < N * 3; i++) pos[i] += vel[i] * dt
      geo.attributes.position.needsUpdate = true
      mat.opacity = life
    }
  }
}

export function buildEnvironment(scene) {
  scene.background = skyTexture()
  scene.fog = new THREE.FogExp2('#221f33', 0.015) // haze: far blocks fade toward the sky glow

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
  scene.add(new THREE.HemisphereLight('#44528a', '#17130f', 0.3)) // the environment map carries the rest of the ambient
  const fill = new THREE.DirectionalLight('#a9b8ee', 0.95)
  fill.position.set(-18, 11, 3) // from behind the camera
  scene.add(fill)

  // city: real volumes at three depths; the haze makes the far ones paler, so the layers separate
  const wins = [windowsTexture(), windowsTexture(), windowsTexture(), windowsTexture()]
  const roofMat = std('#10121a', { roughness: 0.9 })
  const block = (x, z, w, d, h) => {
    const t = wins[(Math.random() * wins.length) | 0].clone()
    t.repeat.set(Math.max(w, d) / 9, h / 34) // 8 windows every 9 m, one floor ≈ 2.1 m
    t.offset.set(Math.floor(Math.random() * 8) / 8, Math.floor(Math.random() * 16) / 16)
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), std('#161a26', { roughness: 0.9, emissive: '#ffffff', emissiveMap: t, emissiveIntensity: 0.55 }))
    m.position.set(x, h / 2, z)
    scene.add(m)
    // rooftop clutter: water tank, stair box, antenna
    if (Math.random() < 0.7) {
      const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 1.6, 10), roofMat)
      tank.position.set(x + rnd(-w / 4, w / 4), h + 0.8, z + rnd(-d / 4, d / 4))
      scene.add(tank)
    }
    if (Math.random() < 0.6) {
      const box = new THREE.Mesh(new THREE.BoxGeometry(rnd(2, 3.5), rnd(1.5, 2.6), rnd(2, 3.5)), roofMat)
      box.position.set(x + rnd(-w / 4, w / 4), h + 1, z + rnd(-d / 4, d / 4))
      scene.add(box)
    }
    if (Math.random() < 0.35) {
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, rnd(3, 6), 5), roofMat)
      mast.position.set(x, h + 2, z)
      scene.add(mast)
    }
  }
  // heights chosen so every layer peeks over the one in front
  for (const [x0, x1, hMin, hMax, gap] of [[17, 21, 4, 6.5, 5], [31, 39, 7, 10.5, 3], [52, 64, 9, 15, 2]]) {
    for (let z = -60; z < 60; ) {
      const d = rnd(7, 13)
      if (Math.random() < 0.85) block(rnd(x0, x1), z + d / 2, rnd(8, 12), d, rnd(hMin, hMax))
      z += d + rnd(0.8, gap)
    }
  }
  for (const side of [-1, 1]) for (const [z0, z1, hMin, hMax] of [[19, 23, 4, 7], [33, 40, 8, 12]]) {
    for (let x = -30; x < 12; ) {
      const w = rnd(7, 12)
      if (Math.random() < 0.85) block(x + w / 2, side * rnd(z0, z1), w, rnd(8, 12), rnd(hMin, hMax))
      x += w + rnd(0.8, 3)
    }
  }

  // street right behind the fence: tree silhouettes and utility poles with sagging cables
  const leaf = std('#0b130d', { roughness: 1 })
  const bark = std('#15100c', { roughness: 1 })
  const tree = (x, z, s) => {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.14 * s, 0.2 * s, 3 * s, 7), bark)
    trunk.position.set(x, 1.5 * s, z)
    scene.add(trunk)
    for (let i = 0; i < 4; i++) {
      const blob = new THREE.Mesh(new THREE.IcosahedronGeometry(rnd(1.1, 1.7) * s, 1), leaf)
      blob.position.set(x + rnd(-0.9, 0.9) * s, (3.2 + rnd(0, 1.6)) * s, z + rnd(-0.9, 0.9) * s)
      scene.add(blob)
    }
  }
  for (const z of [-13.5, -4.5, 5.5, 14]) tree(BASE_X + rnd(6, 9), z + rnd(-1, 1), rnd(1, 1.5))
  for (const side of [-1, 1]) for (const x of [-9, -1]) tree(x + rnd(-1.5, 1.5), side * rnd(12, 14), rnd(1, 1.4))
  const wire = new THREE.LineBasicMaterial({ color: '#05060a' })
  const poleX = BASE_X + 5
  const poleZ = [-33, -19, -6, 8, 22, 35]
  for (const z of poleZ) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 8.4, 8), bark)
    post.position.set(poleX, 4.2, z)
    const cross = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 1.8), bark)
    cross.position.set(poleX, 7.9, z)
    scene.add(post, cross)
  }
  for (let i = 0; i < poleZ.length - 1; i++) for (const [off, y] of [[-0.8, 7.95], [0, 7.95], [0.8, 7.95], [0, 6.9]]) {
    const pts = []
    for (let k = 0; k <= 16; k++) {
      const u = k / 16
      pts.push(new THREE.Vector3(poleX, y - Math.sin(Math.PI * u) * 0.7, poleZ[i] + off + (poleZ[i + 1] - poleZ[i]) * u))
    }
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), wire))
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
  composer.addPass(new ShaderPass(GradeShader)) // on the displayed image: color grade + vignette
  return { composer, bloom }
}

export function makeBall() {
  return shadowed(new THREE.Mesh(new THREE.SphereGeometry(C.ball.radius, 40, 28), ballMaterial()))
}

// ---------- image-based lighting: a tiny night city rendered into a PMREM cube, used as scene.environment ----------
export function nightEnvironment(gl) {
  const env = new THREE.Scene()
  const [c, g] = canvasOf(512, 256)
  const grad = g.createLinearGradient(0, 0, 0, 256)
  grad.addColorStop(0, '#05070f')
  grad.addColorStop(0.42, '#101a3a')
  grad.addColorStop(0.5, '#6a4636') // glow of the city on the horizon
  grad.addColorStop(0.56, '#17130f')
  grad.addColorStop(1, '#0b0a09') // asphalt
  g.fillStyle = grad
  g.fillRect(0, 0, 512, 256)
  for (let i = 0; i < 260; i++) {
    g.fillStyle = Math.random() < 0.75 ? 'rgba(255,205,140,0.9)' : 'rgba(170,205,255,0.8)'
    g.fillRect(Math.random() * 512, rnd(104, 127), rnd(1, 3), rnd(1, 2.5)) // lit windows around the horizon
  }
  const sky = new THREE.Mesh(new THREE.SphereGeometry(60, 32, 16), new THREE.MeshBasicMaterial({ map: texOf(c), side: THREE.BackSide }))
  env.add(sky)
  // the two street lamps as bright warm panels, where they are on the court
  for (const z of [-7, 7]) {
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.2, 1.2), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffd9a8').multiplyScalar(60) }))
    lamp.position.set(BASE_X + 0.8, 7.6, z)
    env.add(lamp)
  }
  const pmrem = new THREE.PMREMGenerator(gl)
  const tex = pmrem.fromScene(env, 0.02, 0.1, 100).texture
  pmrem.dispose()
  return tex
}

// final pass on the displayed image: warm highlights / cool shadows, a touch of contrast and a soft vignette
export const GradeShader = {
  uniforms: { tDiffuse: { value: null } },
  vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse; varying vec2 vUv;
    void main() {
      vec4 c = texture2D(tDiffuse, vUv);
      float l = dot(c.rgb, vec3(0.299, 0.587, 0.114));
      c.rgb *= mix(vec3(0.90, 0.98, 1.12), vec3(1.08, 1.0, 0.88), smoothstep(0.05, 0.65, l)); // teal shadows, sodium highlights
      c.rgb = mix(vec3(l), c.rgb, 1.12);
      c.rgb = (c.rgb - 0.5) * 1.07 + 0.5;
      float d = distance(vUv, vec2(0.5));
      c.rgb *= 1.0 - smoothstep(0.42, 0.95, d) * 0.6;
      gl_FragColor = c;
    }`
}

// ---------- particles ----------
function softSprite() {
  const [c, g] = canvasOf(64)
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  grad.addColorStop(0, 'rgba(255,255,255,1)')
  grad.addColorStop(0.5, 'rgba(255,255,255,0.35)')
  grad.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, 64, 64)
  return texOf(c)
}

// pooled one-shot burst (sparks off the iron, dust kicked up by sneakers)
export function makeBurst({ n, size, color, additive = true, opacity = 1, gravity = 0, life = 0.8 }) {
  const pos = new Float32Array(n * 3)
  const vel = new Float32Array(n * 3)
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  const mat = new THREE.PointsMaterial({ map: softSprite(), size, color, transparent: true, opacity: 0, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending })
  const points = new THREE.Points(geo, mat)
  points.frustumCulled = false
  let t = 0
  return {
    points,
    burst(at, spread, up, speed) {
      t = 1
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2
        pos.set([at.x + Math.cos(a) * spread * Math.random(), at.y, at.z + Math.sin(a) * spread * Math.random()], i * 3)
        vel.set([Math.cos(a) * rnd(0.2, 1) * speed, rnd(0.2, 1) * up, Math.sin(a) * rnd(0.2, 1) * speed], i * 3)
      }
    },
    update(dt) {
      if (t <= 0) return
      t = Math.max(0, t - dt / life)
      for (let i = 0; i < n; i++) {
        vel[i * 3 + 1] += gravity * dt
        for (let k = 0; k < 3; k++) pos[i * 3 + k] += vel[i * 3 + k] * dt
      }
      geo.attributes.position.needsUpdate = true
      mat.opacity = opacity * t
    }
  }
}

// dust and humidity hanging in the lamp light over the court
export function makeMotes() {
  const n = 320
  const pos = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) pos.set([rnd(-11, 2.5), rnd(0.4, 7), rnd(-8, 8)], i * 3)
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  const points = new THREE.Points(geo, new THREE.PointsMaterial({ map: softSprite(), size: 0.07, color: '#ffe2b8', transparent: true, opacity: 0.4, depthWrite: false, blending: THREE.AdditiveBlending }))
  points.frustumCulled = false
  return {
    points,
    update(clock) {
      // the whole cloud drifts: cheap, and reads as slow air
      points.position.set(Math.sin(clock * 0.11) * 0.6, Math.sin(clock * 0.17) * 0.35, Math.cos(clock * 0.09) * 0.6)
    }
  }
}
