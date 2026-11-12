// The Higgsfield player (public/models/player.glb: one static mesh in T-pose, white uniform) turned into a
// SkinnedMesh at load time: bones placed from the model's proportions and skin weights computed here.
// The result has the same joints as the primitive rig in scene3d.js, so render3d.js poses both the same way.
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

const HEIGHT = 1.95
// joints in meters, measured on the model (feet at y = 0, facing +x, arms along ±z)
const J = {
  shoulder: { y: 1.593, z: 0.2 },
  elbow: 0.53, // |z|
  hip: { y: 1.014, z: 0.088 },
  knee: 0.534, // y
  waist: 1.12 // jersey above, shorts below
}
const ramp = (x, a, b) => Math.max(0, Math.min(1, (x - a) / (b - a)))

export async function loadPlayerModel(url = '/models/player.glb') {
  const gltf = await new GLTFLoader().loadAsync(url)
  let src = null
  gltf.scene.updateMatrixWorld(true)
  gltf.scene.traverse(o => (src = src || (o.isMesh ? o : null)))
  const geo = src.geometry.clone().applyMatrix4(src.matrixWorld)
  geo.computeBoundingBox()
  const box = geo.boundingBox
  const k = HEIGHT / (box.max.y - box.min.y)
  geo.translate(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2).scale(k, k, k)

  // bones: 0 torso | 1,2 upper arm / forearm (+z side) | 3,4 (-z side) | 5,6 thigh / shin (+z) | 7,8 (-z)
  const pos = geo.attributes.position
  const index = new Uint16Array(pos.count * 4)
  const weight = new Float32Array(pos.count * 4)
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i)
    const z = pos.getZ(i)
    const az = Math.abs(z)
    const side = z >= 0 ? 0 : 1
    let w = [[0, 1]]
    if (y > 1.3 && az > 0.13) {
      // arm: torso → upper arm across the shoulder, upper arm → forearm across the elbow
      const a = ramp(az, 0.13, 0.26)
      const b = ramp(az, J.elbow - 0.06, J.elbow + 0.06)
      w = [[0, 1 - a], [1 + side * 2, a * (1 - b)], [2 + side * 2, a * b]]
    } else if (y < 1.09) {
      // leg: pelvis → thigh across the hip (both thighs share the crotch of the shorts), thigh → shin across the knee
      const a = ramp(y, 1.09, 0.93)
      const b = ramp(y, J.knee + 0.06, J.knee - 0.06)
      const plus = ramp(z, -0.03, 0.03)
      w = b > 0
        ? [[0, 1 - a], [5 + side * 2, a * (1 - b)], [6 + side * 2, a * b]]
        : [[0, 1 - a], [5, a * plus], [7, a * (1 - plus)]]
    }
    w.forEach(([bone, v], n) => {
      index[i * 4 + n] = bone
      weight[i * 4 + n] = v
    })
  }
  geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(index, 4))
  geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(weight, 4))
  return { geo, material: src.material }
}

function numberTexture(num) {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')
  g.font = '96px Anton, Impact, sans-serif'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillStyle = '#ffffff'
  g.fillText(num, 64, 70)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

// → { root, body, legs, knees, arms, elbows }: same contract as makePlayer() in scene3d.js
export function makeSkinnedPlayer({ geo, material }, { jersey, shorts, num }) {
  const root = new THREE.Group()
  const bone = (parent, x = 0, y = 0, z = 0) => {
    const b = new THREE.Bone()
    b.position.set(x, y, z)
    parent.add(b)
    return b
  }
  const body = bone(root)
  const legs = []
  const knees = []
  const arms = []
  const elbows = []
  const fixes = []
  const skinned = [body]
  for (const side of [1, -1]) {
    // The mesh is bound in T-pose, but the poses assume "all zeros = arm hanging down". Each posed pivot
    // therefore gets a child `fix` bone that is turned 90° after binding (and the elbow undoes it for its own pivot).
    const shoulder = bone(body, 0, J.shoulder.y, side * J.shoulder.z)
    const upper = bone(shoulder)
    const unfix = bone(upper, 0, 0, side * (J.elbow - J.shoulder.z))
    const elbow = bone(unfix)
    const fore = bone(elbow)
    fixes.push([upper, unfix, fore, side])
    arms.push(shoulder)
    elbows.push(elbow)
    skinned.push(upper, fore)
  }
  for (const side of [1, -1]) {
    const hip = bone(body, 0, J.hip.y, side * J.hip.z)
    const knee = bone(hip, 0, J.knee - J.hip.y, 0)
    legs.push(hip)
    knees.push(knee)
    skinned.push(hip, knee)
  }
  root.updateMatrixWorld(true)
  const skeleton = new THREE.Skeleton(skinned) // bind pose = the T-pose, everything still unrotated

  // one shared mesh/texture, two uniforms: white cloth is tinted per team, skin and shoes stay as generated
  const mat = material.clone()
  mat.metalness = 0
  mat.metalnessMap = null
  mat.envMapIntensity = 0.7
  const uJersey = { value: new THREE.Color(jersey) }
  const uShorts = { value: new THREE.Color(shorts) }
  mat.onBeforeCompile = shader => {
    shader.uniforms.uJersey = uJersey
    shader.uniforms.uShorts = uShorts
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying float vRestY;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvRestY = position.y;')
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vRestY;\nuniform vec3 uJersey;\nuniform vec3 uShorts;')
      .replace('#include <map_fragment>', `#include <map_fragment>
        {
          float mx = max(diffuseColor.r, max(diffuseColor.g, diffuseColor.b));
          float mn = min(diffuseColor.r, min(diffuseColor.g, diffuseColor.b));
          float sat = (mx - mn) / max(mx, 0.001);
          // bright, colorless and between the knees and the neck = uniform fabric
          float cloth = (1.0 - smoothstep(0.14, 0.32, sat)) * smoothstep(0.12, 0.3, mx) * step(0.62, vRestY);
          vec3 team = vRestY > ${J.waist.toFixed(2)} ? uJersey : uShorts;
          diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * team * 1.25, cloth);
        }`)
  }
  const mesh = new THREE.SkinnedMesh(geo, mat)
  mesh.castShadow = true
  mesh.receiveShadow = true
  mesh.frustumCulled = false // the bounding box is the T-pose, the pose is not
  root.add(mesh)
  mesh.bind(skeleton)
  for (const [upper, unfix, fore, side] of fixes) {
    upper.rotation.x = (side * Math.PI) / 2 // T-pose arm (along ±z) → hanging down
    unfix.rotation.x = (-side * Math.PI) / 2
    fore.rotation.x = (side * Math.PI) / 2
  }
  // number on the back and the chest, riding the torso bone
  const numMat = new THREE.MeshBasicMaterial({ map: numberTexture(num), transparent: true, depthWrite: false })
  for (const [x, ry] of [[-0.118, -Math.PI / 2], [0.125, Math.PI / 2]]) {
    const n = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.24), numMat)
    n.position.set(x, 1.4, 0)
    n.rotation.y = ry
    body.add(n)
  }
  return { root, body, legs, knees, arms, elbows }
}
