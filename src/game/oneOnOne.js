// 1vs1 half-court mini game (/jugar). Side view: everyone attacks the hoop on the right.
// Canvas 2D by default, no dependencies. createGame(canvas, { onHud, onEnd, renderer?, ballPhysics? }) → { start, input, destroy }
// renderer: { draw(view), destroy() } replaces the 2D drawing (v2 uses Three.js, see render3d.js)
// ballPhysics: { launch(ball, shooter), step(dt) → "make" | "miss" | null } lets a physics engine decide shots that are not blocked

export const W = 960
export const H = 540
export const FLOOR = 468 // feet line
const BACK = 422 // far edge of the floor
const FRONT = 528 // near edge
const MID = (BACK + FRONT) / 2
export const HOOP_X = 846
const RIM_Y = 250
const RIM_R = 22
const BOARD_X = 878
export const THREE_X = HOOP_X - 390
const DUNK_D = 85
const LAYUP_D = 200
const G = 1600
const JUMP_V = 640
const BODY = 36
export const TARGET = 5 // buckets to win

// Style points (saved to the ranking) and buckets (the 5 to win: a three counts 2)
export const PLAYS = {
  three: { label: 'TRIPLE', pts: 10, buckets: 2 },
  dunk: { label: 'CLAVADA', pts: 10, buckets: 1 },
  layup: { label: 'BANDEJA', pts: 5, buckets: 1 },
  mid: { label: 'MEDIA DISTANCIA', pts: 3, buckets: 1 }, // ponytail: not in the original list, jump shots inside the arc needed a value
  block: { label: 'TAPÓN', pts: 2 },
  cross: { label: 'CROSSOVER', pts: 5 },
  ankle: { label: '¡LO TUMBASTE!', pts: 7 }
}
const BASE = { dunk: 0.92, layup: 0.75, mid: 0.5, three: 0.38 }
const CPU_BLOCK = { dunk: 0.35, layup: 0.5, mid: 0.55, three: 0.5 }

export function shotKind(x) {
  const d = HOOP_X - x
  if (d <= DUNK_D) return 'dunk'
  if (d <= LAYUP_D) return 'layup'
  return x < THREE_X ? 'three' : 'mid'
}

/** Release timing quality for jump shots: 1 at the sweet spot (0.8 of the meter), 0 far from it */
export const releaseQuality = m => 1 - Math.min(1, Math.abs(m - 0.8) / 0.4)

const rand = (a, b) => a + Math.random() * (b - a)
const player = (color, num, ai) => ({ x: 0, y: 0, vy: 0, vx: 0, stun: 0, fallen: false, color, num, ai, run: 0, hand: 1, handT: 1, crossCd: 0, stealCd: 0, shooting: null, blockAt: null })

export function createGame(canvas, { onHud = () => {}, onEnd = () => {}, renderer = null, ballPhysics = null } = {}) {
  const ctx = renderer ? null : canvas.getContext('2d')
  const you = player('#ff4f12', '7', false)
  const cpu = player('#2f6fde', '99', true)
  const keys = { left: false, right: false }
  let off, def, phase, ball, pauseT, nextOff, texts, buckets, points, possT, crossPaid, aiT, stealT, netT, raf, last
  let clock = 0
  let running = false // before start() the court is drawn as the intro background

  // read-only window for an external renderer (getters: these variables are reassigned every possession)
  const view = {
    get you() { return you },
    get cpu() { return cpu },
    get off() { return off },
    get phase() { return phase },
    get ball() { return ball },
    get texts() { return texts },
    get netT() { return netT || 0 },
    get clock() { return clock }
  }

  const hud = () => onHud({ you: buckets.you, cpu: buckets.cpu, points, target: TARGET })
  const say = (text, color = '#ede8dc', x, y) => texts.push({ text, color, x: x ?? off.x, y: y ?? FLOOR - 170, t: 0 })
  const award = (play, x) => {
    points += PLAYS[play].pts
    say(`${PLAYS[play].label} +${PLAYS[play].pts}`, '#f5b21b', x)
    hud()
  }

  function reset() {
    buckets = { you: 0, cpu: 0 }
    points = 0
    texts = []
    nextOff = you
    possession()
    hud()
  }

  function possession() {
    off = nextOff
    def = off === you ? cpu : you
    for (const p of [you, cpu]) Object.assign(p, { y: 0, vy: 0, vx: 0, stun: 0, fallen: false, shooting: null, blockAt: null, hand: 1, handT: 1 })
    off.x = 300
    def.x = THREE_X + 40
    ball = null
    possT = 0
    crossPaid = false
    aiT = 0.4
    stealT = 1.2
    phase = 'play'
    say(off === you ? 'TU BALÓN' : 'BALÓN CPU', off === you ? '#ff7a45' : '#7fa6f0', 300)
  }

  function endPossession(delay = 1.4) {
    nextOff = def // every shot, block or steal hands the ball to the other side
    phase = 'pause'
    pauseT = delay
  }

  // ---- actions ----
  function jump(p) {
    if (p.y > 0 || p.stun > 0) return
    p.vy = JUMP_V
    p.y = 0.01
  }

  function startShot(p, q = 0.8) {
    if (p.y > 0 || p.stun > 0 || p.shooting) return
    const kind = shotKind(p.x)
    p.shooting = { kind, t: 0, meter: 0, held: true, q, released: false }
    jump(p)
    p.vx = kind === 'dunk' ? (HOOP_X - 14 - p.x) / 0.4 : kind === 'layup' ? (HOOP_X - 60 - p.x) / 0.4 : 0
    const d = Math.abs(def.x - p.x)
    if (def.ai && def.stun <= 0 && d < 130 && Math.random() < CPU_BLOCK[kind]) def.blockAt = rand(0.08, 0.26)
  }

  function release(p) {
    const s = p.shooting
    s.released = true
    let prob = BASE[s.kind]
    if (s.kind === 'three' || s.kind === 'mid') {
      const q = releaseQuality(p.ai ? s.q : s.meter)
      prob *= 0.5 + 0.65 * q
      if (!p.ai) say(q > 0.85 ? '¡PERFECTO!' : q > 0.5 ? 'BIEN' : 'TARDE/TEMPRANO', q > 0.85 ? '#8be28b' : '#a8a397', p.x, FLOOR - p.y - 190)
    }
    const d = Math.abs(def.x - p.x)
    const free = def.stun > 0
    if (!free && d < 95) prob *= 0.6 + (0.4 * d) / 95
    const blocked = !free && def.y > 35 && d < 75 && Math.random() < (s.kind === 'dunk' ? 0.35 : 0.65)
    const x0 = p.x + 14
    const y0 = FLOOR - p.y - 130
    const dist = HOOP_X - x0
    ball = {
      x: x0, y: y0, x0, y0, t: 0,
      T: s.kind === 'dunk' ? 0.12 : 0.45 + dist / 1100,
      peak: s.kind === 'dunk' ? 0 : 60 + dist * 0.28,
      result: blocked ? 'block' : Math.random() < prob ? 'make' : 'miss',
      kind: s.kind,
      free: null
    }
    phase = 'flight'
    ballPhysics?.launch(ball, p)
  }

  function resolve() {
    const { result, kind } = ball
    if (result === 'make') {
      netT = 0.5
      const side = off === you ? 'you' : 'cpu'
      buckets[side] += PLAYS[kind].buckets
      if (off === you) award(kind, HOOP_X - 120)
      else say(`CPU: ${PLAYS[kind].label}`, '#7fa6f0', HOOP_X - 120)
    } else if (result === 'block') {
      if (def === you) award('block', def.x)
      else say('¡TAPÓN DE LA CPU!', '#7fa6f0', def.x)
    } else say('¡FALLÓ!', '#a8a397', HOOP_X - 120)
    hud()
    endPossession()
  }

  function crossover(p, d) {
    if (p.crossCd > 0 || p.y > 0 || p.shooting || p.stun > 0) return
    p.crossCd = 0.9
    p.hand *= -1
    p.handT = 0
    const gap = d.x - p.x
    if (d.stun > 0 || d.y > 0 || gap < 0 || gap > 90) return
    const r = Math.random()
    const [ankle, beat] = p.ai ? [0.12, 0.55] : [0.22, 0.75]
    const pay = !p.ai && !crossPaid // ponytail: one paid crossover per possession, so spamming X does not farm points
    if (r < ankle) {
      d.stun = 1.6
      d.fallen = true
      if (pay) award('ankle', d.x)
      else say(p.ai ? '¡TE TUMBÓ!' : 'AL PISO', p.ai ? '#7fa6f0' : '#ede8dc', d.x)
    } else if (r < beat) {
      d.stun = 0.7
      if (pay) award('cross', d.x)
    } else {
      say('LEÍDO', '#a8a397', d.x)
      return
    }
    if (pay) crossPaid = true
  }

  function steal(p, carrier) {
    if (p.stealCd > 0 || p.stun > 0 || p.y > 0) return
    p.stealCd = 1
    if (Math.abs(carrier.x - p.x) < 65 && carrier.y === 0 && !carrier.shooting && Math.random() < 0.3) {
      say(p.ai ? 'TE ROBARON' : '¡ROBO!', p.ai ? '#7fa6f0' : '#8be28b', p.x)
      endPossession(0.9)
    } else p.stun = 0.35 // reaching costs a step
  }

  // ---- input (keyboard and touch buttons call this) ----
  function input(name, down) {
    if (name === 'left' || name === 'right') {
      keys[name] = down
      return
    }
    if (phase !== 'play') return
    if (name === 'shoot') {
      if (!down) {
        if (you.shooting) you.shooting.held = false
      } else if (off === you) startShot(you)
      else jump(you)
    } else if (name === 'cross' && down) {
      if (off === you) crossover(you, cpu)
      else steal(you, cpu)
    }
  }

  // ---- AI ----
  function cpuOffense(dt) {
    if (cpu.stun > 0 || cpu.y > 0 || cpu.shooting) return
    possT += dt
    const gap = you.x - cpu.x
    const open = you.stun > 0 || gap < 0 || gap > 110
    const dist = HOOP_X - cpu.x
    const q = rand(0.5, 1.05)
    if (dist <= DUNK_D) return startShot(cpu)
    if (dist <= LAYUP_D && (open || Math.random() < dt * 1.5)) return startShot(cpu)
    aiT -= dt
    if (aiT <= 0) {
      aiT = 0.35
      cpu.vx = Math.random() < 0.15 ? -1 : 1 // vx doubles as dribble direction on the ground
      if (cpu.x < THREE_X - 10 && open && Math.random() < 0.3) return startShot(cpu, q)
      if (cpu.x >= THREE_X && open && Math.random() < 0.25) return startShot(cpu, q)
      if (!open && gap < 60 && Math.random() < 0.45) crossover(cpu, you)
      if (possT > 9) return startShot(cpu, q)
    }
    cpu.x += (cpu.vx || 1) * 230 * dt
    cpu.run += dt * 12
  }

  function cpuDefense(dt) {
    if (cpu.blockAt != null) {
      cpu.blockAt -= dt
      if (cpu.blockAt <= 0) {
        cpu.blockAt = null
        jump(cpu)
      }
    }
    if (cpu.stun > 0 || cpu.y > 0) return
    const sag = you.x < THREE_X - 80 ? 50 : 0
    const target = Math.min(you.x + 52 + (you.x > cpu.x ? 0 : sag), HOOP_X - 20)
    const dx = target - cpu.x
    const step = Math.min(Math.abs(dx), (you.x > cpu.x ? 200 : 255) * dt)
    cpu.x += Math.sign(dx) * step
    if (step > 1) cpu.run += dt * 12
    stealT -= dt
    if (stealT <= 0) {
      stealT = 1.1
      if (Math.abs(you.x - cpu.x) < 60 && !you.shooting && Math.random() < 0.3) steal(cpu, you)
    }
  }

  // ---- update ----
  function physics(p, dt) {
    p.stun = Math.max(0, p.stun - dt)
    if (p.stun === 0) p.fallen = false
    p.crossCd = Math.max(0, p.crossCd - dt)
    p.stealCd = Math.max(0, p.stealCd - dt)
    p.handT = Math.min(1, p.handT + dt / 0.18)
    if (p.y > 0) {
      p.vy -= G * dt
      p.y += p.vy * dt
      p.x += p.vx * dt
      if (p.y <= 0) {
        p.y = 0
        p.vy = 0
        p.vx = 0
        if (p.shooting && !p.shooting.released && phase === 'play') release(p) // landed holding it: forced release
        p.shooting = null
      }
    }
    p.x = Math.max(50, Math.min(BOARD_X - 30, p.x))
  }

  function update(dt) {
    clock += dt
    const prevX = off.x
    if (phase === 'play') {
      if (you.stun <= 0 && you.y === 0 && !you.shooting) {
        const dir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0)
        you.x += dir * 300 * dt
        if (dir) you.run += dt * 12
      }
      if (off === cpu) cpuOffense(dt)
      else cpuDefense(dt)
      // the defender's body stops the drive unless he is beaten or someone is in the air
      if (off.y === 0 && def.y === 0 && def.stun <= 0 && prevX <= def.x - BODY && off.x > def.x - BODY) off.x = def.x - BODY
      const s = off.shooting
      if (s && !s.released) {
        s.t += dt
        if (s.kind === 'dunk' || s.kind === 'layup') {
          if (off.vy <= 0) release(off)
        } else if (off.ai) {
          if (s.t >= 0.38) release(off)
        } else {
          s.meter = Math.min(1, s.t / 0.7)
          if (!s.held || s.meter >= 1) release(off)
        }
      }
    }
    physics(you, dt)
    physics(cpu, dt)
    if (ball) {
      const outcome = ballPhysics?.step(dt)
      if (!ballPhysics || ball.result === 'block') moveBall(dt) // blocks keep the scripted deflection
      else if (outcome && !ball.done) {
        ball.done = true
        ball.result = outcome
        resolve()
      }
    }
    if (phase === 'pause') {
      pauseT -= dt
      if (pauseT <= 0) {
        if (buckets.you >= TARGET || buckets.cpu >= TARGET) {
          phase = 'over'
          onEnd({ score: points, won: buckets.you >= TARGET, you: buckets.you, cpu: buckets.cpu })
        } else possession()
      }
    }
    netT = Math.max(0, (netT || 0) - dt)
    texts = texts.filter(t => (t.t += dt) < 1.4)
  }

  function moveBall(dt) {
    const b = ball
    if (b.free) {
      b.free.vy += G * 0.8 * dt
      b.x += b.free.vx * dt
      b.y += b.free.vy * dt
      if (b.y > FLOOR - 10) {
        b.y = FLOOR - 10
        b.free.vy *= -0.55
        b.free.vx *= 0.7
      }
      return
    }
    b.t += dt
    const u = Math.min(1, b.t / b.T)
    b.x = b.x0 + (HOOP_X - b.x0) * u
    b.y = b.y0 + (RIM_Y - 8 - b.y0) * u - b.peak * 4 * u * (1 - u)
    if (b.result === 'block' && u >= 0.2) {
      b.free = { vx: -300, vy: -220 }
      resolve()
    } else if (u >= 1) {
      b.free = b.result === 'make' ? { vx: 0, vy: 160 } : { vx: -230, vy: -280 }
      if (b.result === 'make') b.x = HOOP_X
      resolve()
    }
  }

  // ---- draw ----
  function drawCourt() {
    const sky = ctx.createLinearGradient(0, 0, 0, BACK)
    sky.addColorStop(0, '#0b0d14')
    sky.addColorStop(1, '#1c1b17')
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, W, BACK)
    // chain-link fence
    ctx.strokeStyle = 'rgba(237,232,220,0.06)'
    ctx.lineWidth = 1
    for (let i = -BACK; i < W; i += 22) {
      ctx.beginPath()
      ctx.moveTo(i, 150)
      ctx.lineTo(i + 272, BACK)
      ctx.moveTo(i + 272, 150)
      ctx.lineTo(i, BACK)
      ctx.stroke()
    }
    ctx.fillStyle = 'rgba(237,232,220,0.08)'
    ctx.fillRect(0, 146, W, 4)
    // street lights
    for (const lx of [120, 520]) {
      const glow = ctx.createRadialGradient(lx, 60, 0, lx, 60, 140)
      glow.addColorStop(0, 'rgba(255,214,150,0.35)')
      glow.addColorStop(1, 'rgba(255,214,150,0)')
      ctx.fillStyle = glow
      ctx.fillRect(lx - 140, 0, 280, 220)
    }
    ctx.font = '120px Anton, sans-serif'
    ctx.fillStyle = 'rgba(255,79,18,0.07)'
    ctx.fillText('TURF.', 40, 330)
    // asphalt
    ctx.fillStyle = '#26251f'
    ctx.fillRect(0, BACK, W, H - BACK)
    ctx.fillStyle = '#2e2c25'
    ctx.fillRect(0, BACK, W, FRONT - BACK)
    // paint (key)
    ctx.fillStyle = 'rgba(255,79,18,0.28)'
    ctx.fillRect(HOOP_X - 190, MID - 26, BOARD_X + 22 - (HOOP_X - 190), 52)
    ctx.strokeStyle = 'rgba(237,232,220,0.75)'
    ctx.lineWidth = 2
    ctx.strokeRect(HOOP_X - 190, MID - 26, BOARD_X + 22 - (HOOP_X - 190), 52)
    // court edges, baseline, half-court line and circle
    ctx.beginPath()
    ctx.moveTo(0, BACK)
    ctx.lineTo(W, BACK)
    ctx.moveTo(0, FRONT)
    ctx.lineTo(W, FRONT)
    ctx.moveTo(BOARD_X + 22, BACK)
    ctx.lineTo(BOARD_X + 22, FRONT)
    ctx.moveTo(40, BACK)
    ctx.lineTo(40, FRONT)
    ctx.stroke()
    ctx.beginPath()
    ctx.ellipse(40, MID, 60, 24, 0, -Math.PI / 2, Math.PI / 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.ellipse(HOOP_X - 190, MID, 40, 26, 0, Math.PI / 2, -Math.PI / 2)
    ctx.stroke()
    // three-point arc
    ctx.strokeStyle = '#ede8dc'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.ellipse(HOOP_X, MID, HOOP_X - THREE_X, (FRONT - BACK) / 2 - 4, 0, Math.PI / 2, (3 * Math.PI) / 2)
    ctx.stroke()
  }

  function drawHoop(front) {
    if (!front) {
      ctx.fillStyle = '#55524a'
      ctx.fillRect(BOARD_X + 26, RIM_Y - 70, 10, FLOOR - 20 - (RIM_Y - 70))
      ctx.fillRect(BOARD_X + 6, RIM_Y - 64, 26, 6)
      ctx.fillStyle = 'rgba(0,0,0,0.35)'
      ctx.beginPath()
      ctx.ellipse(BOARD_X + 31, FLOOR - 18, 26, 6, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#ede8dc'
      ctx.fillRect(BOARD_X, RIM_Y - 96, 8, 110)
      ctx.strokeStyle = '#ff4f12'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.ellipse(HOOP_X, RIM_Y, RIM_R, 5, 0, Math.PI, Math.PI * 2)
      ctx.stroke()
      return
    }
    // net (stretches on a make) and front of the rim
    const stretch = netT > 0 ? Math.sin((netT / 0.5) * Math.PI) * 14 : 0
    ctx.strokeStyle = 'rgba(237,232,220,0.8)'
    ctx.lineWidth = 1.5
    const bottom = RIM_Y + 40 + stretch
    for (let i = 0; i <= 6; i++) {
      const tx = HOOP_X - RIM_R + (i * 2 * RIM_R) / 6
      const bx = HOOP_X - 11 + (i * 22) / 6
      ctx.beginPath()
      ctx.moveTo(tx, RIM_Y)
      ctx.lineTo(bx, bottom)
      ctx.stroke()
    }
    for (const f of [0.35, 0.7]) {
      ctx.beginPath()
      ctx.ellipse(HOOP_X, RIM_Y + (bottom - RIM_Y) * f, RIM_R - 11 * f, 3, 0, 0, Math.PI * 2)
      ctx.stroke()
    }
    ctx.strokeStyle = '#ff4f12'
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.ellipse(HOOP_X, RIM_Y, RIM_R, 5, 0, 0, Math.PI)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(HOOP_X + RIM_R, RIM_Y)
    ctx.lineTo(BOARD_X, RIM_Y)
    ctx.stroke()
  }

  function drawBall(x, y) {
    ctx.fillStyle = '#e8661c'
    ctx.beginPath()
    ctx.arc(x, y, 11, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#2a140a'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(x - 11, y)
    ctx.lineTo(x + 11, y)
    ctx.moveTo(x, y - 11)
    ctx.lineTo(x, y + 11)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(x, y, 11, 0, Math.PI * 2)
    ctx.stroke()
  }

  function limb(x1, y1, x2, y2, color, w) {
    ctx.strokeStyle = color
    ctx.lineWidth = w
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
  }

  function drawPlayer(p) {
    const skin = p.ai ? '#8a5a3c' : '#c68a5e'
    const isOff = p === off
    ctx.fillStyle = 'rgba(0,0,0,0.38)'
    ctx.beginPath()
    ctx.ellipse(p.x, FLOOR + 4, Math.max(10, 24 - p.y * 0.08), 6, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.save()
    ctx.translate(p.x, FLOOR - p.y)
    if (p.fallen) {
      ctx.translate(-10, 0)
      ctx.rotate(-Math.PI / 2)
      ctx.translate(-14, 0)
    }
    ctx.lineCap = 'round'
    const air = p.y > 0
    const s = air ? 0 : Math.sin(p.run) * 12
    // legs
    limb(-6, -50, -6 + s - (air ? 6 : 0), air ? -14 : -2, skin, 9)
    limb(6, -50, 6 - s + (air ? 8 : 0), air ? -22 : -2, skin, 9)
    ctx.fillStyle = '#111'
    ctx.fillRect(-12 + s - (air ? 6 : 0), air ? -18 : -6, 14, 6)
    ctx.fillRect(-2 - s + (air ? 8 : 0), air ? -26 : -6, 14, 6)
    // shorts and jersey
    ctx.fillStyle = p.ai ? '#1d4796' : '#c23a0c'
    ctx.fillRect(-16, -58, 32, 16)
    ctx.fillStyle = p.color
    ctx.beginPath()
    ctx.roundRect(-15, -100, 30, 46, 6)
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.font = '18px Anton, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(p.num, 0, -70)
    // arms
    const shooting = p.shooting && !p.shooting.released
    if (shooting) {
      limb(-11, -94, 2, -132, skin, 8)
      limb(11, -94, 10, -132, skin, 8)
    } else if (!isOff && !p.fallen) {
      limb(-12, -94, -30, air ? -136 : -104, skin, 8)
      limb(12, -94, 30, air ? -136 : -104, skin, 8)
    } else {
      const hx = 24 * (p.hand * p.handT + -p.hand * (1 - p.handT))
      limb(-11, -94, isOff ? hx * 0.5 - 6 : -14, -64, skin, 8)
      limb(11, -94, isOff ? hx : 14, -64, skin, 8)
    }
    // head
    ctx.fillStyle = skin
    ctx.beginPath()
    ctx.arc(0, -114, 13, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#16120e'
    ctx.beginPath()
    ctx.arc(0, -117, 13, Math.PI * 1.05, Math.PI * 1.95)
    ctx.fill()
    if (!p.ai) {
      ctx.fillStyle = '#ff4f12'
      ctx.fillRect(-13, -121, 26, 4) // headband
    }
    ctx.restore()
    ctx.font = '12px "Space Mono", monospace'
    ctx.textAlign = 'center'
    ctx.fillStyle = p.ai ? '#7fa6f0' : '#ff7a45'
    if (!p.fallen) ctx.fillText(p.ai ? 'CPU' : 'TÚ', p.x, FLOOR - p.y - 136)
    else {
      ctx.fillStyle = '#f5b21b'
      ctx.fillText('✦ ✦ ✦', p.x - 20, FLOOR - 40 - Math.sin(clock * 8) * 4)
    }
  }

  function draw() {
    const scale = canvas.width / W
    ctx.setTransform(scale, 0, 0, scale, 0, 0)
    drawCourt()
    drawHoop(false)
    const order = [you, cpu].sort((a, b) => (a === off) - (b === off)) // ball handler in front
    for (const p of order) drawPlayer(p)
    // ball
    if (ball) drawBall(ball.x, ball.y)
    else if (phase === 'play' || phase === 'pause') {
      const s = off.shooting
      if (s && !s.released) drawBall(off.x + 6, FLOOR - off.y - 140)
      else if (!off.fallen) {
        const hx = 24 * (off.hand * off.handT + -off.hand * (1 - off.handT))
        const bounce = off.y > 0 ? 0 : Math.abs(Math.sin(clock * 9)) * 46
        drawBall(off.x + hx, FLOOR - 12 - bounce)
      }
    }
    drawHoop(true)
    // shot meter
    const s = you.shooting
    if (s && !s.released && (s.kind === 'three' || s.kind === 'mid')) {
      const mx = you.x - 34
      const my = FLOOR - you.y - 168
      ctx.fillStyle = 'rgba(0,0,0,0.6)'
      ctx.fillRect(mx - 2, my - 2, 72, 12)
      ctx.fillStyle = 'rgba(139,226,139,0.45)'
      ctx.fillRect(mx + 68 * 0.68, my, 68 * 0.24, 8)
      ctx.fillStyle = '#f5b21b'
      ctx.fillRect(mx, my, 68 * s.meter, 8)
    }
    // floating texts
    ctx.textAlign = 'center'
    for (const t of texts) {
      ctx.globalAlpha = Math.max(0, 1 - t.t / 1.4)
      ctx.font = '30px Anton, sans-serif'
      ctx.lineWidth = 5
      ctx.strokeStyle = 'rgba(0,0,0,0.7)'
      ctx.strokeText(t.text, Math.min(W - 120, Math.max(120, t.x)), t.y - t.t * 50)
      ctx.fillStyle = t.color
      ctx.fillText(t.text, Math.min(W - 120, Math.max(120, t.x)), t.y - t.t * 50)
    }
    ctx.globalAlpha = 1
    ctx.textAlign = 'left'
  }

  function frame(now) {
    const dt = Math.min(0.033, (now - last) / 1000)
    last = now
    if (running && phase !== 'over') update(dt)
    if (renderer) renderer.draw(view, dt)
    else draw()
    raf = requestAnimationFrame(frame)
  }

  reset()
  texts = []
  last = performance.now()
  raf = requestAnimationFrame(frame)

  return {
    start() {
      reset()
      running = true
    },
    input,
    destroy() {
      cancelAnimationFrame(raf)
      renderer?.destroy()
    }
  }
}
