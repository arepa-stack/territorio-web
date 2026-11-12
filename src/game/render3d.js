// v2 of the 1vs1 game: Three.js renderer + cannon-es ball physics, plugged into oneOnOne.js (the rules stay there).
// create3D(canvas, { onImpact }) → { renderer, ballPhysics } for createGame(canvas, { ...create3D(canvas) })
import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import C from './court-config.json'
import { FLOOR, HOOP_X } from './oneOnOne'

const G = 9.82
const BASE_X = C.rim.toBaseline // baseline, world x
const BOARD_X = C.rim.toBaseline - C.backboard.toBaseline // backboard face, world x
const RIM = new THREE.Vector3(0, C.rim.height, 0)
const wx = gx => (gx - HOOP_X) * C.logic.pxToMeters // logic x (px) → world x (rim at 0)
const jumpM = py => py * C.logic.jumpPxToMeters
const rand = (a, b) => a + Math.random() * (b - a)
const ease = (dt, k) => 1 - Math.exp(-dt * k)

// ---------- procedural textures ----------
const X0 = -13 // court texture covers x ∈ [-13, 3], z ∈ [-8, 8]
const Z0 = -8
const PPM = 128
const cx = x => (x - X0) * PPM
const cz = z => (z - Z0) * PPM

function courtTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 16 * PPM
  const g = c.getContext('2d')
  g.fillStyle = '#23221d'
  g.fillRect(0, 0, c.width, c.height)
  for (let i = 0; i < 16000; i++) {
    const v = (28 + Math.random() * 34) | 0
    g.fillStyle = `rgba(${v},${v},${v - 4},0.55)`
    g.fillRect(Math.random() * c.width, Math.random() * c.height, 2, 2)
  }
  const half = C.halfCourt.width / 2
  const midX = BASE_X - C.halfCourt.length
  const keyX = BASE_X - C.key.length
  g.fillStyle = 'rgba(70,66,56,0.5)'
  g.fillRect(cx(midX), cz(-half), C.halfCourt.length * PPM, C.halfCourt.width * PPM)
  g.fillStyle = 'rgba(255,79,18,0.55)'
  g.fillRect(cx(keyX), cz(-C.key.width / 2), C.key.length * PPM, C.key.width * PPM)
  g.font = `${2.4 * PPM}px Anton, Impact, sans-serif`
  g.textAlign = 'center'
  g.fillStyle = 'rgba(255,79,18,0.3)'
  g.fillText('TURF.', cx(midX + 3.4), cz(5.2))

  g.strokeStyle = '#ede8dc'
  g.lineWidth = C.lineWidth * PPM
  g.strokeRect(cx(midX), cz(-half), C.halfCourt.length * PPM, C.halfCourt.width * PPM)
  g.strokeRect(cx(keyX), cz(-C.key.width / 2), C.key.length * PPM, C.key.width * PPM)
  const arc = (x, z, r, a0, a1, dash) => {
    g.setLineDash(dash ? [24, 24] : [])
    g.beginPath()
    g.arc(cx(x), cz(z), r * PPM, a0, a1)
    g.stroke()
  }
  arc(keyX, 0, C.freeThrowCircle, Math.PI / 2, Math.PI * 1.5) // toward the court: solid
  arc(keyX, 0, C.freeThrowCircle, -Math.PI / 2, Math.PI / 2, true) // inside the key: dashed
  arc(0, 0, C.restrictedArea, Math.PI / 2, Math.PI * 1.5)
  arc(midX, 0, C.centerCircle, -Math.PI / 2, Math.PI / 2)
  g.setLineDash([])
  // three-point line: straight in the corners, arc around the rim
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
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function ballTexture() {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 256
  const g = c.getContext('2d')
  g.fillStyle = '#d4601e'
  g.fillRect(0, 0, 512, 256)
  for (let i = 0; i < 5000; i++) {
    g.fillStyle = `rgba(0,0,0,${Math.random() * 0.12})`
    g.fillRect(Math.random() * 512, Math.random() * 256, 2, 2)
  }
  g.strokeStyle = '#1b0e07'
  g.lineWidth = 6
  g.beginPath()
  g.moveTo(0, 128)
  g.lineTo(512, 128)
  for (const u of [128, 384]) {
    g.moveTo(u, 0)
    g.lineTo(u, 256)
  }
  g.stroke()
  for (const s of [1, -1]) {
    g.beginPath()
    for (let u = 0; u <= 512; u += 8) g.lineTo(u, 128 + s * 90 * Math.cos((u / 512) * Math.PI * 2))
    g.stroke()
  }
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function fenceTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')
  g.strokeStyle = 'rgba(200,200,190,0.55)'
  g.lineWidth = 2
  g.beginPath()
  g.moveTo(0, 0)
  g.lineTo(64, 64)
  g.moveTo(64, 0)
  g.lineTo(0, 64)
  g.stroke()
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  return tex
}

function numberTexture(num, color) {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')
  g.font = '96px Anton, Impact, sans-serif'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillStyle = color
  g.fillText(num, 64, 70)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

// ---------- meshes ----------
const std = (color, extra) => new THREE.MeshStandardMaterial({ color, roughness: 0.75, ...extra })
const shadowed = m => {
  m.castShadow = true
  m.receiveShadow = true
  return m
}

// ponytail: capsule placeholder rig (body, two legs, two arms); swapped for the Higgsfield .glb in phase 3
function makePlayer({ jersey, shorts, skin, num, headband }) {
  const root = new THREE.Group()
  const body = new THREE.Group()
  root.add(body)
  const torso = shadowed(new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 0.5, 6, 14), std(jersey)))
  torso.position.y = 1.27
  const hips = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.27, 0.3, 16), std(shorts)))
  hips.position.y = 0.9
  const head = shadowed(new THREE.Mesh(new THREE.SphereGeometry(0.13, 18, 14), std(skin)))
  head.position.y = 1.8
  body.add(torso, hips, head)
  if (headband) {
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.128, 0.022, 8, 24), std(headband))
    band.rotation.x = Math.PI / 2
    band.position.y = 1.86
    body.add(band)
  }
  const number = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.32), new THREE.MeshBasicMaterial({ map: numberTexture(num, '#ffffff'), transparent: true }))
  number.position.set(0, 1.3, 0.245)
  body.add(number)
  const limb = (y, z, r, len, color) => {
    const pivot = new THREE.Group()
    pivot.position.set(0, y, z)
    const m = shadowed(new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 4, 10), std(color)))
    m.position.y = -(len / 2 + r)
    pivot.add(m)
    body.add(pivot)
    return pivot
  }
  const legs = [limb(0.86, 0.12, 0.085, 0.62, skin), limb(0.86, -0.12, 0.085, 0.62, skin)]
  for (const l of legs) {
    const shoe = shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.1, 0.13), std('#111111')))
    shoe.position.set(0.05, -0.82, 0)
    l.add(shoe)
  }
  const arms = [limb(1.52, 0.3, 0.06, 0.5, skin), limb(1.52, -0.3, 0.06, 0.5, skin)]
  return { root, body, legs, arms }
}

function buildHoop(scene) {
  const poleX = BASE_X + 1
  const pole = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 3.5, 16), std('#4d4a43', { metalness: 0.6, roughness: 0.4 })))
  pole.position.set(poleX, 1.75, 0)
  const arm = shadowed(new THREE.Mesh(new THREE.BoxGeometry(poleX - BOARD_X, 0.12, 0.12), std('#4d4a43', { metalness: 0.6 })))
  arm.position.set((poleX + BOARD_X) / 2, 3.35, 0)
  const b = C.backboard
  const board = shadowed(new THREE.Mesh(new THREE.BoxGeometry(b.thickness, b.height, b.width), std('#f2f2ee', { transparent: true, opacity: 0.88, roughness: 0.2 })))
  board.position.set(BOARD_X + b.thickness / 2, b.bottom + b.height / 2, 0)
  // shooter's square on the board
  const sq = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.PlaneGeometry(0.59, 0.45)),
    new THREE.LineBasicMaterial({ color: '#ff4f12' })
  )
  sq.rotation.y = Math.PI / 2
  sq.position.set(BOARD_X - 0.002, RIM.y + 0.225, 0)
  const borderLine = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(b.width - 0.04, b.height - 0.04)), new THREE.LineBasicMaterial({ color: '#ff4f12' }))
  borderLine.rotation.y = Math.PI / 2
  borderLine.position.set(BOARD_X - 0.002, b.bottom + b.height / 2, 0)
  const rimMat = std('#ff4f12', { metalness: 0.5, roughness: 0.35 })
  const rim = shadowed(new THREE.Mesh(new THREE.TorusGeometry(C.rim.radius, C.rim.tube * 1.4, 10, 40), rimMat))
  rim.rotation.x = Math.PI / 2
  // rim, neck and net hang from a pivot on the board so a dunk can bend them down
  const flex = new THREE.Group()
  flex.position.set(BOARD_X, RIM.y, 0)
  rim.position.set(RIM.x - BOARD_X, 0, 0)
  const neck = new THREE.Mesh(new THREE.BoxGeometry(BOARD_X - C.rim.radius, 0.03, 0.08), rimMat)
  neck.position.set((C.rim.radius - BOARD_X) / 2, 0, 0)
  const net = new THREE.Mesh(
    new THREE.CylinderGeometry(C.rim.radius, 0.13, 0.42, 14, 4, true),
    new THREE.MeshBasicMaterial({ color: '#ede8dc', wireframe: true, transparent: true, opacity: 0.75 })
  )
  net.position.set(RIM.x - BOARD_X, -0.21, 0)
  flex.add(rim, neck, net)
  scene.add(pole, arm, board, sq, borderLine, flex)
  return { net, flex }
}

function buildEnvironment(scene) {
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(90, 90), std('#151410', { roughness: 0.95 }))
  ground.rotation.x = -Math.PI / 2
  ground.position.y = -0.005
  ground.receiveShadow = true
  const court = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), std('#ffffff', { map: courtTexture(), roughness: 0.9 }))
  court.rotation.x = -Math.PI / 2
  court.position.set(X0 + 8, 0, Z0 + 8)
  court.receiveShadow = true
  scene.add(ground, court)
  // chain-link fence behind the court and behind the baseline
  const fenceTex = fenceTexture()
  const fence = (w, h, x, z, rotY) => {
    const t = fenceTex.clone()
    t.repeat.set(w * 3, h * 3)
    t.needsUpdate = true
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, transparent: true, side: THREE.DoubleSide, depthWrite: false }))
    m.position.set(x, h / 2, z)
    m.rotation.y = rotY
    scene.add(m)
    for (let i = 0; i <= w; i += 3) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, h, 8), std('#5a574f', { metalness: 0.6 }))
      const along = -w / 2 + i
      post.position.set(x + (rotY ? 0 : along), h / 2, z + (rotY ? along : 0))
      scene.add(post)
    }
  }
  fence(20, 3.6, -5, -9.5, 0)
  fence(19, 3.6, BASE_X + 2.6, 0, Math.PI / 2)
  // street lamps
  for (const x of [-11, -1]) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 7, 10), std('#3d3b35', { metalness: 0.5 }))
    pole.position.set(x, 3.5, -10.2)
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12), new THREE.MeshBasicMaterial({ color: '#ffe2b0' }))
    lamp.position.set(x, 7, -10)
    const light = new THREE.PointLight('#ffd59a', 60, 26, 1.4)
    light.position.copy(lamp.position)
    scene.add(pole, lamp, light)
  }
}

// ---------- physics ----------
function buildWorld() {
  const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -G, 0) })
  const mBall = new CANNON.Material('ball')
  const mRim = new CANNON.Material('rim')
  const mBoard = new CANNON.Material('board')
  const mFloor = new CANNON.Material('floor')
  world.addContactMaterial(new CANNON.ContactMaterial(mBall, mRim, { restitution: 0.5, friction: 0.25 }))
  world.addContactMaterial(new CANNON.ContactMaterial(mBall, mBoard, { restitution: 0.62, friction: 0.3 }))
  world.addContactMaterial(new CANNON.ContactMaterial(mBall, mFloor, { restitution: 0.78, friction: 0.5 }))
  const floor = new CANNON.Body({ mass: 0, material: mFloor, shape: new CANNON.Plane() })
  floor.quaternion.setFromEuler(-Math.PI / 2, 0, 0)
  const b = C.backboard
  const board = new CANNON.Body({ mass: 0, material: mBoard, shape: new CANNON.Box(new CANNON.Vec3(b.thickness / 2, b.height / 2, b.width / 2)) })
  board.position.set(BOARD_X + b.thickness / 2, b.bottom + b.height / 2, 0)
  // compound rim: a ring of small spheres (gaps far smaller than the ball) + the neck to the board
  const rim = new CANNON.Body({ mass: 0, material: mRim })
  const N = 24
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2
    rim.addShape(new CANNON.Sphere(C.rim.tube), new CANNON.Vec3(Math.cos(a) * C.rim.radius, 0, Math.sin(a) * C.rim.radius))
  }
  rim.addShape(new CANNON.Box(new CANNON.Vec3((BOARD_X - C.rim.radius) / 2, 0.015, 0.04)), new CANNON.Vec3((C.rim.radius + BOARD_X) / 2, 0, 0))
  rim.position.set(RIM.x, RIM.y, RIM.z)
  const ball = new CANNON.Body({ mass: C.ball.mass, material: mBall, shape: new CANNON.Sphere(C.ball.radius), linearDamping: 0, angularDamping: 0.1 }) // no air drag: the launch math assumes a clean parabola
  ball.position.set(0, -10, 0)
  world.addBody(floor)
  world.addBody(board)
  world.addBody(rim)
  world.addBody(ball)
  return { world, ball, floor, board, rim }
}

// ---- ball physics: decides every shot that is not blocked. Separate from the renderer so it can be measured alone ----
// handOf(shooter): where the hands hold the ball at the dunk release (from the renderer), so the slam starts there
export function createBallPhysics(zOf = () => 0, onImpact = () => {}, handOf = () => null) {
  const { world, ball, floor, board, rim } = buildWorld()
  let shot = null
  // collisions drive the rim/board/floor sounds, louder the harder the hit
  ball.addEventListener('collide', e => {
    const v = Math.abs(e.contact.getImpactVelocityAlongNormal())
    if (!shot || v < 0.6) return
    onImpact(e.body === rim ? 'rim' : e.body === board ? 'board' : e.body === floor ? 'floor' : null, Math.min(1, v / 7))
  })
  return {
    body: ball,
    launch(b, shooter) {
      const z = zOf(shooter)
      const start = new CANNON.Vec3(wx(shooter.x) + 0.2, C.players.height + 0.45 + jumpM(shooter.y), z)
      if (b.kind === 'dunk') {
        const h = handOf(shooter)
        if (h) start.set(h.x, h.y, h.z)
        else start.set(-0.05, RIM.y + 0.42, 0.05)
      }
      ball.position.copy(start)
      ball.angularVelocity.set(0, 0, 8) // backspin
      shot = { t: 0, prevY: start.y, done: false, block: b.result === 'block', deflected: false }
      if (shot.block) {
        ball.velocity.set(3, 2.5, 0)
        return
      }
      // the logic's make/miss becomes aim error; the rim and the board have the final word
      const err = b.result === 'make' ? rand(0, b.kind === 'dunk' ? 0.02 : 0.05) : b.kind === 'dunk' ? rand(0.3, 0.36) : rand(0.17, 0.32)
      const ang = Math.random() * Math.PI * 2
      const target = new CANNON.Vec3(RIM.x + Math.cos(ang) * err, RIM.y, RIM.z + Math.sin(ang) * err)
      const dist = Math.hypot(target.x - start.x, target.z - start.z)
      const T = b.kind === 'dunk' ? 0.14 : 0.75 + dist * 0.08
      ball.velocity.set((target.x - start.x) / T, (target.y - start.y) / T + 0.5 * G * T, (target.z - start.z) / T)
    },
    step(dt) {
      if (!shot) return null
      world.step(1 / 120, dt, 10)
      shot.t += dt
      if (shot.block) {
        if (!shot.deflected && shot.t > 0.08) {
          shot.deflected = true
          ball.velocity.set(-3.4, 2.8, rand(-1.5, 1.5))
        }
        return null
      }
      if (shot.done) return null
      const p = ball.position
      const r = Math.hypot(p.x - RIM.x, p.z - RIM.z)
      let outcome = null
      if (shot.prevY > RIM.y && p.y <= RIM.y && r < C.rim.radius - 0.03) outcome = 'make'
      else if ((shot.t > 0.35 && p.y < RIM.y - 0.6) || shot.t > 4) outcome = 'miss'
      shot.prevY = p.y
      if (outcome) shot.done = true
      return outcome
    }
  }
}

export function create3D(canvas, { onImpact } = {}) {
  const gl = new THREE.WebGLRenderer({ canvas, antialias: true })
  gl.shadowMap.enabled = true
  gl.shadowMap.type = THREE.PCFSoftShadowMap
  gl.toneMapping = THREE.ACESFilmicToneMapping
  gl.toneMappingExposure = 1.15
  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#0b0d14')
  scene.fog = new THREE.Fog('#0b0d14', 20, 48)
  const camera = new THREE.PerspectiveCamera(C.camera.fov, 16 / 9, 0.1, 120)

  scene.add(new THREE.HemisphereLight('#8a96b8', '#2a261c', 0.9))
  const sun = new THREE.DirectionalLight('#fff1dc', 2.2)
  sun.position.set(-8, 14, 9)
  sun.target.position.set(-4, 0, 0)
  sun.castShadow = true
  sun.shadow.mapSize.set(1024, 1024)
  Object.assign(sun.shadow.camera, { left: -11, right: 11, top: 11, bottom: -11, near: 1, far: 45 })
  scene.add(sun, sun.target)

  buildEnvironment(scene)
  const { net, flex } = buildHoop(scene)
  const ballMesh = shadowed(new THREE.Mesh(new THREE.SphereGeometry(C.ball.radius, 28, 20), std('#ffffff', { map: ballTexture(), roughness: 0.65 })))
  scene.add(ballMesh)
  const rigs = new Map() // logic player object → capsule rig
  const zs = new WeakMap() // current lateral position of each player
  const rigFor = p => {
    if (!rigs.has(p)) {
      const rig = p.ai
        ? makePlayer({ jersey: '#2f6fde', shorts: '#1d4796', skin: '#8a5a3c', num: p.num })
        : makePlayer({ jersey: '#ff4f12', shorts: '#c23a0c', skin: '#c68a5e', num: p.num, headband: '#ff4f12' })
      scene.add(rig.root)
      rigs.set(p, rig)
    }
    return rigs.get(p)
  }

  // DOM overlay for floating texts, name tags and the shot meter (the canvas parent is position: relative)
  const overlay = document.createElement('div')
  overlay.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:hidden;font-family:Anton,Impact,sans-serif'
  canvas.parentElement.insertBefore(overlay, canvas.nextSibling)
  const el = css => {
    const d = document.createElement('div')
    d.style.cssText = `position:absolute;left:0;top:0;white-space:nowrap;will-change:transform;${css}`
    overlay.appendChild(d)
    return d
  }
  const textPool = Array.from({ length: 6 }, () => el('text-shadow:0 2px 0 #000,0 0 8px #000;letter-spacing:0.02em'))
  const tags = [el("font:12px 'Space Mono',monospace"), el("font:12px 'Space Mono',monospace")]
  const meter = el('width:72px;height:10px;background:rgba(0,0,0,.6);border:1px solid rgba(255,255,255,.25)')
  meter.innerHTML = '<i style="position:absolute;left:68%;width:24%;top:0;bottom:0;background:rgba(139,226,139,.5)"></i><b style="position:absolute;left:0;top:0;bottom:0;background:#f5b21b"></b>'
  const meterFill = meter.querySelector('b')

  const v3 = new THREE.Vector3()
  let cw = 0
  let ch = 0
  const place = (node, x, y, z, show = true) => {
    v3.set(x, y, z).project(camera)
    node.style.display = show && v3.z < 1 ? '' : 'none'
    const sx = Math.min(cw * 0.92, Math.max(cw * 0.08, ((v3.x + 1) / 2) * cw))
    node.style.transform = `translate(${sx}px, ${((1 - v3.y) / 2) * ch}px) translate(-50%, -100%)`
  }

  const camPos = new THREE.Vector3(-5, C.camera.height, C.camera.distance)
  const look = new THREE.Vector3(-4, 1.6, 0)
  const camTarget = new THREE.Vector3()
  const lookTarget = new THREE.Vector3()

  // dunk choreography on the rules' timing: wind-up (0.4 s to the apex), slam, hang on the rim, drop
  const dunkT = new WeakMap() // seconds since the dunk release
  const handsOf = new Map() // where the dunker's hands hold the ball (also the physics start of the slam)
  let rimBend = 0
  let rimVel = 0
  let shake = 0
  const smooth = t => t * t * (3 - 2 * t)
  const ARM = 0.62 // shoulder to hand
  const SHOULDER = 1.52

  function poseRig(p, view, dt) {
    const rig = rigFor(p)
    const isOff = p === view.off
    const s = p.shooting
    const dunk = s?.kind === 'dunk'
    const target = dunk ? 0.05 : isOff ? C.players.offenseZ : C.players.defenseZ
    const cur = zs.get(p) ?? target
    const z = cur + (target - cur) * ease(dt, dunk ? 12 : 6)
    zs.set(p, z)
    let x = wx(p.x)
    let lift = jumpM(p.y)
    const air = p.y > 0
    const swing = air ? 0 : Math.sin(p.run) * 0.65
    let legF = air ? 0.5 : swing
    let legB = air ? -0.25 : -swing
    let lean = 0
    const [a0, a1] = rig.arms
    a0.rotation.set(0, 0, 0)
    a1.rotation.set(0, 0, 0)
    handsOf.delete(p)

    if (dunk) {
      lift *= 1.5 // hands must get above the rim: render-only boost of the rules' jump
      if (!s.released) {
        // wind-up: knees up, ball from the chest to behind the head
        const u = smooth(Math.min(1, s.t / 0.4))
        const th = 1.6 + 1.9 * u
        a0.rotation.z = a1.rotation.z = th
        lean = -0.12 * u
        legF = 0.9
        legB = -0.6
        dunkT.delete(p)
        const reach = ARM + C.ball.radius * 0.8
        handsOf.set(p, new THREE.Vector3(x + Math.sin(th) * reach, lift + SHOULDER - Math.cos(th) * reach, z))
      } else {
        if (!dunkT.has(p)) shake = 0.3 // first frame after the release is the slam
        const t = (dunkT.get(p) ?? 0) + dt
        dunkT.set(p, t)
        if (t < 0.12) {
          // slam: arms whip from behind the head down through the rim
          a0.rotation.z = a1.rotation.z = 3.5 - 1.5 * smooth(t / 0.12)
          lean = -0.2
        } else {
          // hanging from the front of the rim, legs swinging
          a0.rotation.z = a1.rotation.z = Math.PI - 0.15
          legF = legB = 0.5 + Math.sin(t * 9) * 0.25
        }
        // hands on the front of the (bent) rim
        const hangX = RIM.x - C.rim.radius - Math.sin(0.15) * ARM
        const hangLift = RIM.y - SHOULDER - Math.cos(0.15) * ARM - rimBend * (BOARD_X + C.rim.radius)
        const k = Math.min(1, t / 0.15)
        x += (hangX - x) * k
        lift = p.hang > 0 ? lift + (hangLift - lift) * k : Math.min(lift, hangLift)
      }
    } else if (s && !s.released) {
      a0.rotation.z = a1.rotation.z = Math.PI * 0.92
    } else if (!isOff) {
      a0.rotation.x = air ? -2.7 : -1.9
      a1.rotation.x = air ? 2.7 : 1.9
    } else {
      a0.rotation.z = 0.6
      a1.rotation.z = 0.6
    }
    rig.legs[0].rotation.z = legF
    rig.legs[1].rotation.z = legB
    rig.root.position.set(x, lift, z)
    // ankle breaker: on the floor, sitting back
    rig.body.rotation.z = p.fallen ? Math.PI / 2 : lean
    rig.body.position.set(p.fallen ? -0.3 : 0, p.fallen ? C.players.radius : 0, 0)
    return z
  }

  const ballPhysics = createBallPhysics(p => zs.get(p) ?? C.players.offenseZ, onImpact, p => handsOf.get(p))
  const ball = ballPhysics.body

  const renderer = {
    draw(view, dt) {
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      if (w !== cw || h !== ch) {
        cw = w
        ch = h
        gl.setPixelRatio(Math.min(2, window.devicePixelRatio || 1))
        gl.setSize(w, h, false)
        camera.aspect = w / h
        camera.updateProjectionMatrix()
      }
      const { you, cpu, off } = view
      const zByPlayer = new Map([you, cpu].map(p => [p, poseRig(p, view, dt)]))

      // ball: physics body in flight, otherwise dribbled / held by the ball handler
      if (view.ball) {
        ballMesh.position.copy(ball.position)
        ballMesh.quaternion.copy(ball.quaternion)
      } else if (!off.fallen) {
        const z = zByPlayer.get(off)
        const hand = 0.3 * (off.hand * off.handT - off.hand * (1 - off.handT))
        const held = handsOf.get(off)
        if (held) ballMesh.position.copy(held)
        else if (off.shooting && !off.shooting.released) ballMesh.position.set(wx(off.x) + 0.12, C.players.height + 0.5 + jumpM(off.y), z)
        else ballMesh.position.set(wx(off.x) + 0.3, C.ball.radius + Math.abs(Math.sin(view.clock * 9)) * 0.75 + jumpM(off.y), z + hand)
        ballMesh.rotation.z = -view.clock * 6
      }

      // net swish
      const stretch = view.netT > 0 ? Math.sin((view.netT / 0.5) * Math.PI) * 0.4 : 0
      net.scale.y = 1 + stretch
      net.position.y = -0.21 * (1 + stretch)

      // the rim bends while someone hangs on it, then wobbles back (damped spring)
      const hanging = [you, cpu].some(p => p.hang > 0 && p.shooting?.kind === 'dunk')
      rimVel += (-(rimBend - (hanging ? 0.13 : 0)) * 420 - rimVel * 9) * dt
      rimBend += rimVel * dt
      flex.rotation.z = rimBend

      // broadcast camera: follows the play, keeps the hoop in frame, pushes in on dunks
      let focus = Math.min(-1.2, Math.max(-8.5, wx(off.x) * 0.55))
      if (view.ball) focus = focus * 0.5 + Math.min(0, ballMesh.position.x) * 0.5
      const dunk = off.shooting?.kind === 'dunk' || view.ball?.kind === 'dunk'
      camTarget.set(focus - 0.6, C.camera.height - (dunk ? 0.5 : 0), dunk ? C.camera.dunkDistance : C.camera.distance)
      lookTarget.set(focus + 0.9, dunk ? 2.4 : 1.7, 0)
      camPos.lerp(camTarget, ease(dt, 3))
      look.lerp(lookTarget, ease(dt, 3))
      camera.position.copy(camPos)
      if (shake > 0) {
        shake = Math.max(0, shake - dt)
        camera.position.x += (Math.random() - 0.5) * shake * 0.5
        camera.position.y += (Math.random() - 0.5) * shake * 0.5
      }
      camera.lookAt(look)
      gl.render(scene, camera)

      // overlay
      const fontPx = Math.max(16, cw / 30)
      textPool.forEach((node, i) => {
        const t = view.texts[i]
        if (!t) return (node.style.display = 'none')
        node.textContent = t.text
        node.style.color = t.color
        node.style.fontSize = `${fontPx}px`
        node.style.opacity = String(Math.max(0, 1 - t.t / 1.4))
        place(node, wx(t.x), (FLOOR - t.y) * C.logic.textPxToMeters + t.t * 0.5, 0)
      })
      ;[you, cpu].forEach((p, i) => {
        const node = tags[i]
        node.textContent = p.fallen ? '✦ ✦ ✦' : p.ai ? 'CPU' : 'TÚ'
        node.style.color = p.fallen ? '#f5b21b' : p.ai ? '#7fa6f0' : '#ff7a45'
        place(node, wx(p.x), p.fallen ? 0.9 : C.players.height + 0.25 + jumpM(p.y), zByPlayer.get(p))
      })
      const s = you.shooting
      const showMeter = !!s && !s.released && (s.kind === 'three' || s.kind === 'mid')
      place(meter, wx(you.x), C.players.height + 0.55 + jumpM(you.y), zByPlayer.get(you), showMeter)
      if (showMeter) meterFill.style.width = `${s.meter * 100}%`
    },
    destroy() {
      overlay.remove()
      gl.dispose()
      gl.forceContextLoss()
    }
  }

  return { renderer, ballPhysics }
}
