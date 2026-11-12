// v2 of the 1vs1 game: Three.js renderer + cannon-es ball physics, plugged into oneOnOne.js (the rules stay there).
// create3D(canvas, { onImpact }) → { renderer, ballPhysics } for createGame(canvas, { ...create3D(canvas) })
import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import C from './court-config.json'
import { loadPlayerModel, makeSkinnedPlayer } from './playerModel'
import { FLOOR, HOOP_X } from './oneOnOne'
import { BOARD_X, RIG, RIM, buildEnvironment, buildHoop, createComposer, makeBall, makeBurst, makeFire, makeMotes, makePlayer, makeRing, nightEnvironment } from './scene3d'

const G = 9.82
const wx = gx => (gx - HOOP_X) * C.logic.pxToMeters // logic x (px) → world x (rim at 0)
const wz = gz => gz * C.logic.pxToMeters // logic z (px) → world z
const jumpM = py => py * C.logic.jumpPxToMeters
const rand = (a, b) => a + Math.random() * (b - a)
const ease = (dt, k) => 1 - Math.exp(-dt * k)

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
  let netWas = 0
  const gl = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' })
  gl.shadowMap.enabled = true
  gl.shadowMap.type = THREE.PCFSoftShadowMap
  gl.toneMapping = THREE.ACESFilmicToneMapping
  gl.toneMappingExposure = 1.05
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(C.camera.fov, 16 / 9, 0.1, 160)
  buildEnvironment(scene)
  // image-based lighting: glass, steel, leather and sweat reflect the night city and the lamps
  scene.environment = nightEnvironment(gl)
  scene.environmentIntensity = 0.6
  const { net, flex, board } = buildHoop(scene)
  const sparks = makeBurst({ n: 36, size: 0.1, color: new THREE.Color('#ffd27a').multiplyScalar(4), gravity: -7, life: 0.45 })
  const dust = makeBurst({ n: 26, size: 0.55, color: '#b9ab95', additive: false, opacity: 0.3, life: 0.7 })
  const motes = makeMotes()
  scene.add(sparks.points, dust.points, motes.points)
  const feet = new THREE.Vector3()
  let shake = 0
  const ballMesh = makeBall()
  const { ring, material: ringMat } = makeRing()
  const fire = makeFire()
  scene.add(ballMesh, ring, fire.points)
  const RING_YOU = new THREE.Color('#ff7a1e').multiplyScalar(2.2)
  const RING_CPU = new THREE.Color('#4f8cff').multiplyScalar(2.2)
  const { composer } = createComposer(gl, scene, camera)
  // quality steps down by itself if the device cannot hold the frame rate: 0 full, 1 = 1x pixels, 2 = no bloom, 3 = small shadows
  let quality = 0
  let slow = 0
  let frames = 0
  let fpsT = 0
  const impact = (surface, k) => {
    onImpact?.(surface, k)
    if (surface === 'rim') net.kick(k)
    // a hard hit on the iron or the glass: the whole hoop rattles, sparks fly, the camera feels it
    if ((surface === 'rim' || surface === 'board') && k > 0.45) {
      board.kick(k)
      shake = Math.max(shake, k * 0.12)
      if (surface === 'rim') sparks.burst(ballMesh.position, 0.05, 1.6 * k, 2.2 * k)
    }
  }
  const rigs = new Map() // logic player object → rig (same joints for the skinned model and the primitive one)
  // the real player model arrives a moment after the first frame; until then (or if it fails to load)
  // the primitive mannequins stand in, then they are swapped out
  let model = null
  loadPlayerModel()
    .then(m => {
      model = m
      for (const rig of rigs.values()) scene.remove(rig.root)
      rigs.clear()
    })
    .catch(e => console.warn('player model not loaded, keeping the mannequins', e))
  const rigFor = p => {
    if (!rigs.has(p)) {
      const look = p.ai
        ? { jersey: '#2f6fde', shorts: '#1d4796', skin: '#8a5a3c', num: p.num, shoe: '#e8e8e4' }
        : { jersey: '#ff4f12', shorts: '#c23a0c', skin: '#c68a5e', num: p.num, headband: '#ff4f12' }
      const rig = model ? makeSkinnedPlayer(model, look) : makePlayer(look)
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
  const meter = el('width:34px;height:104px;filter:drop-shadow(0 0 4px rgba(0,0,0,.8))')
  const ARC = 'M26 100 Q2 52 26 4'
  meter.innerHTML = `<svg viewBox="0 0 34 104" width="34" height="104" fill="none" stroke-linecap="round">
    <path d="${ARC}" stroke="rgba(0,0,0,.65)" stroke-width="9"/>
    <path d="${ARC}" pathLength="100" stroke="rgba(120,235,140,.85)" stroke-width="7" stroke-dasharray="24 100" stroke-dashoffset="-68" stroke-linecap="butt"/>
    <path id="fill" d="${ARC}" pathLength="100" stroke="#f5b21b" stroke-width="4" stroke-dasharray="0 100"/>
  </svg>`
  const meterFill = meter.querySelector('#fill')
  let meterGlow = 0 // keeps the meter up, in green, for a moment after a perfect release
  let glowDone = false

  const v3 = new THREE.Vector3()
  let cw = 0
  let ch = 0
  const place = (node, x, y, z, show = true, dx = 0, dy = 0) => {
    v3.set(x, y, z).project(camera)
    node.style.display = show && v3.z < 1 ? '' : 'none'
    const sx = Math.min(cw * 0.92, Math.max(cw * 0.08, ((v3.x + 1) / 2) * cw))
    node.style.transform = `translate(${sx + dx}px, ${((1 - v3.y) / 2) * ch + dy}px) translate(-50%, -100%)`
  }

  const camPos = new THREE.Vector3(-C.camera.back, C.camera.height, 0)
  const look = new THREE.Vector3(-3, 1.7, 0)
  const camTarget = new THREE.Vector3()
  const lookTarget = new THREE.Vector3()

  // dunk choreography on the rules' timing: wind-up (0.4 s to the apex), slam, hang on the rim, drop
  const dunkT = new WeakMap() // seconds since the dunk release
  const handsOf = new Map() // where the dunker's hands hold the ball (also the physics start of the slam)
  const facing = new WeakMap() // smoothed heading of each player (rotation.y)
  let rimBend = 0
  let rimVel = 0
  const smooth = t => t * t * (3 - 2 * t)
  const ARM = RIG.arm // shoulder to hand
  const SHOULDER = RIG.shoulder
  const LEG = RIG.leg // hip to sole
  // player-local offset (forward, side) → world x/z for a heading ry
  const local = (x, z, ry, fwd, side) => [x + fwd * Math.cos(ry) + side * Math.sin(ry), z - fwd * Math.sin(ry) + side * Math.cos(ry)]
  const tmp = new THREE.Euler()
  // two-bone IK: put a hand on a world point (shoulder → elbow → hand), elbow bending forward
  const UPPER = 0.34
  const FORE = RIG.arm - UPPER
  const DOWN = new THREE.Vector3(0, -1, 0)
  const AXIS_Z = new THREE.Vector3(0, 0, 1)
  const qz = new THREE.Quaternion()
  const ikTarget = new THREE.Vector3()
  function reach(rig, i, world) {
    const shoulder = rig.arms[i]
    const d = rig.body.worldToLocal(ikTarget.copy(world)).sub(shoulder.position)
    const dist = Math.min(UPPER + FORE - 0.002, Math.max(0.12, d.length()))
    const a = Math.acos(clamp1((UPPER * UPPER + dist * dist - FORE * FORE) / (2 * UPPER * dist)))
    const bend = Math.PI - Math.acos(clamp1((UPPER * UPPER + FORE * FORE - dist * dist) / (2 * UPPER * FORE)))
    shoulder.quaternion.setFromUnitVectors(DOWN, d.normalize()).multiply(qz.setFromAxisAngle(AXIS_Z, -a))
    rig.elbows[i].rotation.set(0, 0, bend)
  }
  const dribblePos = new THREE.Vector3() // where the ball is while it is being dribbled (the hand goes to it)
  const handWas = new WeakMap()
  const shotWas = new WeakMap()
  const lastPos = new WeakMap() // previous floor position, for the lean into the direction of travel
  const clamp1 = v => Math.max(-1, Math.min(1, v))

  function poseRig(p, view, dt) {
    const rig = rigFor(p)
    const joints = [...rig.arms, ...rig.elbows, ...rig.legs, ...rig.knees, rig.body]
    const before = joints.map(j => [j.rotation.x, j.rotation.y, j.rotation.z])
    const isOff = p === view.off
    const other = p === view.you ? view.cpu : view.you
    const s = p.shooting
    const dunk = s?.kind === 'dunk'
    let x = wx(p.x)
    let z = wz(p.z)
    let lift = jumpM(p.y)
    const air = p.y > 0
    const stride = Math.sin(p.run)
    let legF = air ? 0.55 : stride * 0.7
    let legB = air ? -0.2 : -stride * 0.7
    // knees fold on the leg that swings back; both tuck in the air
    let kneeF = air ? 0.9 : 0.15 + Math.max(0, -stride) * 0.9
    let kneeB = air ? 0.45 : 0.15 + Math.max(0, stride) * 0.9
    let lean = 0 // forward (+) / back (-)
    let tilt = 0 // sideways
    let crouch = 0 // hip + knee flex, lowers the body
    let spread = 0
    let blend = 16 // how fast the joints chase the pose (1/s)
    const [a0, a1] = rig.arms
    const [e0, e1] = rig.elbows
    for (const j of [a0, a1, e0, e1]) j.rotation.set(0, 0, 0)
    handsOf.delete(p)

    // heading: the ball handler squares up to the rim, the defender to the ball handler
    const goal = dunk ? 0 : isOff ? Math.atan2(z, -x) : Math.atan2(z - wz(other.z), wx(other.x) - x)
    let ry = facing.get(p) ?? goal
    ry += Math.atan2(Math.sin(goal - ry), Math.cos(goal - ry)) * ease(dt, dunk ? 16 : 10)
    facing.set(p, ry)
    // velocity in the player's own frame: forward (toward where he faces) and sideways
    const was = lastPos.get(p)
    lastPos.set(p, [x, z])
    let vf = 0
    let vs = 0
    if (was && dt > 0) {
      const vx = (x - was[0]) / dt
      const vz = (z - was[1]) / dt
      vf = clamp1((vx * Math.cos(ry) - vz * Math.sin(ry)) / 5.2)
      vs = clamp1((vx * Math.sin(ry) + vz * Math.cos(ry)) / 5.2)
    }

    if (dunk) {
      blend = 40 // the slam must snap
      lift *= 1.5 // hands must get above the rim: render-only boost of the rules' jump
      if (!s.released) {
        // wind-up: knees up, ball from the chest to behind the head
        const u = smooth(Math.min(1, s.t / 0.4))
        const th = 1.6 + 1.9 * u
        a0.rotation.z = a1.rotation.z = th
        lean = 0.12 * u
        legF = 0.9
        legB = -0.5
        kneeF = 1.4
        kneeB = 1.0
        dunkT.delete(p)
        const reach = ARM + C.ball.radius * 0.8
        const [hx, hz] = local(x, z, ry, Math.sin(th) * reach, 0)
        handsOf.set(p, new THREE.Vector3(hx, lift + SHOULDER - Math.cos(th) * reach, hz))
      } else {
        if (!dunkT.has(p)) {
          // first frame after the release is the slam
          shake = 0.3
          board.kick(1.6)
          sparks.burst(RIM, C.rim.radius, 2.2, 2.6)
        }
        const t = (dunkT.get(p) ?? 0) + dt
        dunkT.set(p, t)
        if (t < 0.12) {
          // slam: arms whip from behind the head down through the rim
          a0.rotation.z = a1.rotation.z = 3.5 - 1.5 * smooth(t / 0.12)
          lean = 0.2
        } else {
          // hanging from the front of the rim, legs swinging
          a0.rotation.z = a1.rotation.z = Math.PI - 0.15
          legF = legB = 0.45 + Math.sin(t * 9) * 0.25
          kneeF = kneeB = 0.7
        }
        // hands on the front of the (bent) rim
        const hangX = RIM.x - C.rim.radius - Math.sin(0.15) * ARM
        const hangLift = RIM.y - SHOULDER - Math.cos(0.15) * ARM - rimBend * (BOARD_X + C.rim.radius)
        const k = Math.min(1, t / 0.15)
        x += (hangX - x) * k
        z += (0.05 - z) * k
        lift = p.hang > 0 ? lift + (hangLift - lift) * k : Math.min(lift, hangLift)
      }
    } else if (s && !s.released) {
      // jump shot / layup: both arms up, shooting elbow cocked, follow-through as the meter fills
      const cock = 1 - Math.min(1, s.t / 0.35)
      a0.rotation.z = a1.rotation.z = Math.PI * 0.86
      e0.rotation.z = e1.rotation.z = 0.25 + 0.9 * cock
      a1.rotation.x = 0.2
      lean = -0.05
    } else if (!isOff) {
      const contest = air || !!view.ball || (other.shooting && !other.shooting.released)
      if (contest) {
        // shot contest: one arm straight up at the ball, the other out for balance
        a0.rotation.z = Math.PI * 0.95
        a1.rotation.x = 0.9
        e1.rotation.x = 0.5
        crouch = air ? 0 : 0.12
        blend = 26
      } else {
        // real defensive stance: low and wide, the hand on the ball side down digging at the dribble,
        // the other out in the lane, weight shifting from foot to foot
        const mirror = other.hand > 0 ? -1 : 1 // he faces the handler, so the ball is on his opposite side
        const [low, lowE, wide, wideE] = mirror > 0 ? [a0, e0, a1, e1] : [a1, e1, a0, e0]
        const sway = Math.sin(view.clock * 5)
        low.rotation.z = 0.95
        low.rotation.x = -mirror * 0.2
        lowE.rotation.z = 0.3
        wide.rotation.x = -mirror * 1.1 // outward on his other side
        wide.rotation.z = 0.25
        wideE.rotation.x = -mirror * 0.45
        crouch = 0.52 + 0.05 * sway
        spread = 0.34
        lean = 0.22
        tilt = 0.07 * sway + vs * 0.2
        legF += 0.12 * sway
        legB -= 0.12 * sway
      }
      if (p.stun > 0 && !p.fallen) {
        // beaten by the crossover: stumbles back, off balance
        tilt = Math.sin(p.stun * 14) * 0.3
        lean = -0.28
      }
    } else {
      // dribbling; a crossover (handT 0 → 1) drops the hips, leans into the new side and widens the stance.
      // The torso also leans into wherever he is accelerating.
      const cross = p.handT < 1
      const c = cross ? Math.sin(Math.PI * p.handT) : 0
      crouch = 0.22 + 0.5 * c
      tilt = p.hand * 0.3 * c + vs * 0.25
      spread = 0.1 + 0.5 * c
      lean = 0.14 + 0.2 * c + vf * 0.22
      const [dArm, dElbow, oArm, oElbow] = p.hand > 0 ? [a0, e0, a1, e1] : [a1, e1, a0, e0]
      const pump = Math.abs(Math.sin(view.clock * 9)) // the dribbling hand rides the bounce
      if (cross) {
        // hand to hand: the old hand pushes the ball across low, the new one reaches in to catch it and carries it out
        const u = p.handT
        oArm.rotation.z = 0.55
        oArm.rotation.x = -p.hand * 0.55 * (1 - u)
        oElbow.rotation.z = 0.35 + 0.5 * u
        dArm.rotation.z = 0.55
        dArm.rotation.x = p.hand * (0.45 - 0.9 * u)
        dElbow.rotation.z = 0.35
      } else {
        dArm.rotation.z = 0.35 + 0.25 * pump
        dArm.rotation.x = -p.hand * 0.3
        dElbow.rotation.z = 0.5 + 0.55 * pump
        oArm.rotation.z = 0.3
        oArm.rotation.x = p.hand * 0.45 // guards the ball
        oElbow.rotation.z = 1.0
      }
      blend = 22
    }
    if (air && !dunk) crouch = 0
    rig.legs[0].rotation.set(-spread, 0, legF + crouch)
    rig.legs[1].rotation.set(spread, 0, legB + crouch)
    rig.knees[0].rotation.set(0, 0, -(kneeF + crouch * 2))
    rig.knees[1].rotation.set(0, 0, -(kneeB + crouch * 2))
    // ankle breaker: on the floor, sitting back
    rig.body.rotation.set(p.fallen ? 0 : tilt, 0, p.fallen ? Math.PI / 2 : -lean)

    // ease every joint from where it was toward the pose: no popping between states
    const k = ease(dt, blend)
    joints.forEach((j, i) => {
      const [bx, by, bz] = before[i]
      tmp.copy(j.rotation)
      j.rotation.set(bx + (tmp.x - bx) * k, by + (tmp.y - by) * k, bz + (tmp.z - bz) * k)
    })
    // hips drop by what the (eased) knee bend takes off the leg length, so the feet stay on the floor
    const bend = air ? 0 : Math.max(0, -(rig.knees[0].rotation.z + rig.knees[1].rotation.z) / 4)
    const drop = p.fallen ? 0 : LEG * (1 - Math.cos(bend)) + RIG.thigh * (1 - Math.cos(Math.abs(rig.legs[0].rotation.x)))
    rig.root.position.set(x, lift, z)
    rig.root.rotation.y = ry
    rig.body.position.set(p.fallen ? -0.3 : 0, p.fallen ? C.players.radius : -drop, 0)

    if (isOff && !s && !p.fallen && !air) {
      // the dribble: the ball's spot, and the hand that rides it up and down (IK), hand to hand on a crossover
      const cross = p.handT < 1
      const [bx, bz] = cross ? local(x, z, ry, 0.38, p.hand * 0.36 * (2 * smooth(p.handT) - 1)) : local(x, z, ry, 0.3, p.hand * 0.36)
      const by = C.ball.radius + (cross ? 0.5 * Math.abs(Math.cos(Math.PI * p.handT)) : Math.abs(Math.sin(view.clock * 9)) * 0.75)
      dribblePos.set(bx, by, bz)
      const newArm = p.hand > 0 ? 0 : 1
      rig.root.updateMatrixWorld(true)
      reach(rig, cross && p.handT < 0.5 ? 1 - newArm : newArm, v3.set(bx, by + C.ball.radius * 0.85, bz))
    }
    // sneakers kick up dust on a hard crossover and when he plants to shoot
    if (p.handT < (handWas.get(p) ?? 1) || (s && !shotWas.get(p) && !dunk)) dust.burst(feet.set(x, 0.08, z), 0.25, 0.7, 1.1)
    handWas.set(p, p.handT)
    shotWas.set(p, !!s)
    return z
  }

  const ballPhysics = createBallPhysics(p => wz(p.z), impact, p => handsOf.get(p))
  const ball = ballPhysics.body

  const renderer = {
    draw(view, dt) {
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      if (w !== cw || h !== ch) {
        cw = w
        ch = h
        const pr = quality > 0 ? 1 : Math.min(2, window.devicePixelRatio || 1)
        gl.setPixelRatio(pr)
        gl.setSize(w, h, false)
        composer.setPixelRatio(pr)
        composer.setSize(w, h)
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
        const x = wx(off.x)
        const ry = facing.get(off) ?? 0
        const held = handsOf.get(off)
        if (held) ballMesh.position.copy(held)
        else if (off.shooting && !off.shooting.released) {
          const [bx, bz] = local(x, z, ry, 0.12, 0)
          ballMesh.position.set(bx, C.players.height + 0.5 + jumpM(off.y), bz)
        } else ballMesh.position.copy(dribblePos)
        ballMesh.rotation.z = -view.clock * 6
      }

      // net: pulled down when the ball drops through (netT restarts on every make), then springs back
      if (view.netT > netWas) {
        net.swish()
        if (view.ball?.perfect) fire.burst() // green release that goes in: the rim catches fire
      }
      fire.update(dt)
      sparks.update(dt)
      dust.update(dt)
      motes.update(view.clock)
      board.update(dt)
      ring.visible = view.phase !== 'over' && !view.ball
      ring.position.set(wx(off.x), 0.02, zByPlayer.get(off))
      ring.rotation.y = facing.get(off) ?? 0
      ring.scale.setScalar(1 + Math.sin(view.clock * 5) * 0.05)
      ringMat.color.copy(off.ai ? RING_CPU : RING_YOU)
      netWas = view.netT
      net.update(dt, view.ball ? ballMesh.position : null) // the ball pushes the net links aside

      // the rim bends while someone hangs on it, then wobbles back (damped spring)
      const hanging = [you, cpu].some(p => p.hang > 0 && p.shooting?.kind === 'dunk')
      rimVel += (-(rimBend - (hanging ? 0.13 : 0)) * 420 - rimVel * 9) * dt
      rimBend += rimVel * dt
      flex.rotation.z = rimBend

      // 2K-style camera: behind the ball handler, facing the hoop, sliding sideways with him.
      // Driving into the paint (or dunking) it moves in and drops for drama.
      const K = C.camera
      const px = wx(off.x)
      const pz = wz(off.z)
      const dunk = off.shooting?.kind === 'dunk' || view.ball?.kind === 'dunk'
      const drive = dunk || Math.hypot(px, pz) < K.driveRadius
      // off to one side of the handler's back so he never hides the defender: the duel reads on a diagonal
      camTarget.set(Math.min(drive ? -K.driveBack : -K.back, px - (drive ? K.driveFollow : K.follow)), drive ? K.driveHeight : K.height, pz * K.lateral + K.shoulder)
      // look between the play (ball in flight, otherwise the handler) and the rim, so the hoop never leaves the frame
      const fx = view.ball ? ballMesh.position.x : px
      const fz = view.ball ? ballMesh.position.z : pz
      lookTarget.set(fx * 0.45, drive ? 2.3 : 1.7, fz * 0.45)
      if (dunk) {
        // hero shot: drop low under the play and look up at the rim; eases back to the 2K camera after he lands
        camTarget.set(-K.dunkBack, K.dunkHeight, pz * K.lateral + K.shoulder * 0.8)
        lookTarget.set(-0.3, RIM.y - 0.1, 0)
      }
      camPos.lerp(camTarget, ease(dt, dunk ? 5 : 3))
      look.lerp(lookTarget, ease(dt, dunk ? 5 : 3))
      camera.position.copy(camPos)
      if (shake > 0) {
        shake = Math.max(0, shake - dt)
        camera.position.x += (Math.random() - 0.5) * shake * 0.5
        camera.position.y += (Math.random() - 0.5) * shake * 0.5
      }
      camera.lookAt(look)
      if (quality < 2) composer.render(dt)
      else gl.render(scene, camera)

      // measured frame rate (also exposed on the canvas for testing) drives the automatic quality steps
      frames++
      fpsT += dt
      if (fpsT >= 1) {
        const fps = frames / fpsT
        canvas.dataset.fps = fps.toFixed(0)
        canvas.dataset.quality = String(quality)
        slow = fps < 45 ? slow + 1 : 0
        if (slow >= 2 && quality < 3) {
          quality++
          slow = 0
          cw = 0 // re-apply the pixel ratio
          if (quality === 3) scene.traverse(o => {
            if (o.isSpotLight) {
              o.shadow.mapSize.set(1024, 1024)
              o.shadow.map?.dispose()
              o.shadow.map = null
            }
          })
        }
        frames = 0
        fpsT = 0
      }

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
      const charging = !!s && !s.released && (s.kind === 'three' || s.kind === 'mid')
      if (charging) {
        meterFill.setAttribute('stroke-dasharray', `${s.meter * 100} 100`)
        meterFill.setAttribute('stroke', '#f5b21b')
        meterGlow = 0
        glowDone = false
      } else if (view.ball?.perfect && !glowDone) {
        glowDone = true // once per shot
        meterGlow = 0.45
        meterFill.setAttribute('stroke', '#7cf08e')
      }
      meterGlow = Math.max(0, meterGlow - dt)
      // beside the shooting shoulder, in screen space
      place(meter, wx(you.x), RIG.shoulder + 0.25 + jumpM(you.y), zByPlayer.get(you), charging || meterGlow > 0, cw * 0.045, 40)
    },
    destroy() {
      overlay.remove()
      composer.dispose()
      gl.dispose()
      gl.forceContextLoss()
    }
  }

  return { renderer, ballPhysics }
}
