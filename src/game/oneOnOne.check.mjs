import assert from 'node:assert'
// Self-check of the 1vs1 game: rules + 40 headless games must finish. Run: npm run check:game
const mod = await import('./oneOnOne.js')
const { createGame, shotKind, releaseQuality, PLAYS, THREE_X, TARGET } = mod
assert.equal(shotKind(THREE_X - 20), 'three'); assert.equal(shotKind(THREE_X + 20), 'mid')
assert.equal(shotKind(846, 395), 'three'); assert.equal(shotKind(846, 300), 'mid') // from the wing
assert.equal(shotKind(846 - 150), 'layup'); assert.equal(shotKind(846 - 40), 'dunk')
assert.equal(releaseQuality(0.8), 1); assert.equal(releaseQuality(0.2), 0)
assert.equal(PLAYS.three.buckets, 2); assert.equal(PLAYS.three.pts, 10); assert.equal(PLAYS.ankle.pts, 7)
// headless full games: stub canvas + rAF, drive frames by hand
const noop = new Proxy(function () {}, { get: () => noop, apply: () => noop })
const canvas = { width: 960, getContext: () => noop }
let cb; globalThis.requestAnimationFrame = f => (cb = f, 1); globalThis.cancelAnimationFrame = () => {}
let t = 0; globalThis.performance = { now: () => t }
let wins = 0, games = 0, maxPts = 0
for (let g = 0; g < 80; g++) {
  const lateral = g >= 40 // second half: the 3D rules (free movement on the floor)
  let end = null
  const game = createGame(canvas, { onEnd: r => (end = r), lateral })
  game.start()
  let i = 0
  while (!end && i < 60 * 60 * 10) {
    // bot user: drive right, shoot/jump/cross at random
    game.input('right', Math.random() < 0.8)
    if (lateral && i % 15 === 0) {
      game.input('up', Math.random() < 0.3)
      game.input('down', Math.random() < 0.3)
    }
    if (i % 20 === 0) game.input('cross', true)
    if (i % 45 === 0) game.input('shoot', true)
    if (i % 45 === 33) game.input('shoot', false)
    t += 16; cb(t); i++
  }
  assert(end, 'game must finish')
  assert(end.you >= TARGET || end.cpu >= TARGET)
  games++; if (end.won) wins++; maxPts = Math.max(maxPts, end.score)
}
console.log('ok', { games, wins, maxPts })
