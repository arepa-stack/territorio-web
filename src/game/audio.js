// Game sounds synthesized with the Web Audio API: no files to download, 0 Higgsfield credits.
// createAudio({ physicsImpacts }) → { unlock, event, impact, startCrowd, stopCrowd, play, setMuted, destroy }
// physicsImpacts: in 3D the rim/board/floor sounds come from real collisions (impact()), not from the rules' "miss"

export function createAudio({ physicsImpacts = false } = {}) {
  let ctx = null
  let master = null
  let noiseBuf = null
  let crowd = null
  let muted = false
  const last = {}

  // must run inside a user gesture (the "Jugar" click): browsers keep audio locked until then
  function unlock() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext
      if (!AC) return
      ctx = new AC()
      master = ctx.createGain()
      master.gain.value = muted ? 0 : 0.8
      master.connect(ctx.destination)
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
      const d = noiseBuf.getChannelData(0)
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
    }
    if (ctx.state === 'suspended') ctx.resume()
  }

  const envelope = (g, t, attack, peak, dur) => {
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(peak, t + attack)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  }

  function tone(freq, dur, { type = 'sine', vol = 0.3, to, attack = 0.005, at = 0 } = {}) {
    const t = ctx.currentTime + at
    const o = ctx.createOscillator()
    o.type = type
    o.frequency.setValueAtTime(freq, t)
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur)
    const g = ctx.createGain()
    envelope(g, t, attack, vol, dur)
    o.connect(g).connect(master)
    o.start(t)
    o.stop(t + dur + 0.05)
  }

  function noise(dur, { vol = 0.3, type = 'bandpass', freq = 1000, q = 1, to, attack = 0.005, at = 0, loop = false } = {}) {
    const t = ctx.currentTime + at
    const src = ctx.createBufferSource()
    src.buffer = noiseBuf
    src.loop = loop
    const f = ctx.createBiquadFilter()
    f.type = type
    f.frequency.setValueAtTime(freq, t)
    f.Q.value = q
    if (to) f.frequency.exponentialRampToValueAtTime(to, t + dur)
    const g = ctx.createGain()
    if (loop) g.gain.value = vol
    else envelope(g, t, attack, vol, dur)
    src.connect(f).connect(g).connect(master)
    src.start(t, Math.random())
    if (!loop) src.stop(t + dur + 0.05)
    return src
  }

  // k = intensity 0..1 (impact speed for physics sounds)
  const SOUNDS = {
    dribble: k => {
      tone(115, 0.09, { to: 55, vol: 0.35 * k })
      noise(0.03, { freq: 2600, vol: 0.05 * k })
    },
    floor: k => SOUNDS.dribble(k),
    rim: k => {
      // inharmonic partials = metallic clang
      for (const [f, v] of [[520, 1], [1310, 0.6], [2150, 0.35], [3400, 0.2]]) tone(f, 0.25 + 0.4 * k, { type: 'triangle', vol: 0.12 * v * k })
      noise(0.04, { freq: 4000, vol: 0.08 * k })
    },
    board: k => {
      tone(165, 0.15, { to: 90, vol: 0.4 * k })
      noise(0.08, { type: 'lowpass', freq: 900, vol: 0.25 * k })
    },
    swish: () => noise(0.35, { freq: 3200, to: 1200, q: 0.8, vol: 0.25, attack: 0.03 }),
    release: () => noise(0.18, { freq: 600, to: 1800, q: 0.7, vol: 0.06, attack: 0.04 }),
    squeak: () => {
      tone(1900, 0.11, { to: 2700, type: 'square', vol: 0.03 })
      tone(1950, 0.09, { to: 2500, vol: 0.04, at: 0.05 })
    },
    whistle: () => {
      for (const f of [2750, 2890]) tone(f, 0.45, { vol: 0.07, attack: 0.02 })
    },
    buzzer: () => {
      tone(196, 0.9, { type: 'sawtooth', vol: 0.1 })
      tone(207, 0.9, { type: 'sawtooth', vol: 0.07 })
    },
    cheer: k => noise(1.4, { freq: 900, q: 0.5, vol: 0.2 * k, attack: 0.15 }),
    groan: () => noise(0.9, { freq: 380, to: 220, q: 0.8, vol: 0.12, attack: 0.1 }),
    steal: () => {
      tone(880, 0.07, { type: 'square', vol: 0.04 })
      tone(1320, 0.09, { type: 'square', vol: 0.04, at: 0.07 })
    }
  }

  function play(name, k = 1) {
    if (!ctx || muted || !SOUNDS[name]) return
    const now = performance.now()
    if (now - (last[name] || 0) < 60) return // a ball rolling on the rim fires dozens of contacts
    last[name] = now
    SOUNDS[name](Math.max(0.15, Math.min(1, k)))
  }

  // game events from oneOnOne.js
  function event(name, d = {}) {
    if (name === 'dribble') play('dribble', 0.6)
    else if (name === 'release') {
      play('release')
      if (d.kind === 'dunk') {
        play('rim', 1) // hands slam the iron
        play('board', 0.9)
      }
    }
    else if (name === 'make') {
      play('swish')
      play(d.byYou ? 'cheer' : 'groan', 1)
    } else if (name === 'miss' && !physicsImpacts) play('rim', 0.8)
    else if (name === 'block') {
      play('board', 0.7)
      play(d.byYou ? 'cheer' : 'groan', 0.7)
    } else if (name === 'cross') {
      play('squeak')
      if (d.ankle) play(d.byYou ? 'cheer' : 'groan', 0.9)
    } else if (name === 'steal') play('steal')
  }

  return {
    unlock,
    event,
    impact: (surface, k) => play(surface, k), // 'rim' | 'board' | 'floor' from the physics engine
    play,
    startCrowd() {
      if (ctx && !crowd) crowd = noise(1, { type: 'lowpass', freq: 520, vol: 0.035, loop: true })
    },
    stopCrowd() {
      crowd?.stop()
      crowd = null
    },
    setMuted(m) {
      muted = m
      if (master) master.gain.value = m ? 0 : 0.8
    },
    destroy() {
      crowd?.stop()
      ctx?.close()
    }
  }
}
