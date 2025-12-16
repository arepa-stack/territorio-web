<template>
    <div ref="container" class="basketball-3d-viewer"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

const container = ref(null)
let scene, camera, renderer, basketball, animationId
let bounceVelocity = 0
let isBouncing = false
const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()

onMounted(() => {
    initThree()
    animate()
    // Add click listener
    window.addEventListener('click', onMouseClick)
})

onUnmounted(() => {
    if (animationId) {
        cancelAnimationFrame(animationId)
    }
    if (renderer) {
        renderer.dispose()
    }
    window.removeEventListener('click', onMouseClick)
})

const onMouseClick = (event) => {
    if (!basketball || !container.value) return

    // Calculate mouse position in normalized device coordinates
    const rect = container.value.getBoundingClientRect()
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    // Update raycaster
    raycaster.setFromCamera(mouse, camera)

    // Check for intersections
    const intersects = raycaster.intersectObject(basketball, true)

    if (intersects.length > 0) {
        // Trigger bounce - smaller and smoother
        bounceVelocity = 0.15
        isBouncing = true
    }
}

const initThree = () => {
    // Scene
    scene = new THREE.Scene()

    // Camera
    camera = new THREE.PerspectiveCamera(
        45,
        container.value.clientWidth / container.value.clientHeight,
        0.1,
        1000
    )
    camera.position.z = 5

    // Renderer
    renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true
    })
    renderer.setSize(container.value.clientWidth, container.value.clientHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    container.value.appendChild(renderer.domElement)

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(5, 5, 5)
    scene.add(directionalLight)

    const orangeLight = new THREE.PointLight(0xFF6B00, 1, 100)
    orangeLight.position.set(-3, 0, 3)
    scene.add(orangeLight)

    const blueLight = new THREE.PointLight(0x00D9FF, 0.5, 100)
    blueLight.position.set(3, 0, 3)
    scene.add(blueLight)

    // Load GLB Model
    const loader = new GLTFLoader()
    loader.load(
        '/src/assets/3DModels/Basketball.glb',
        (gltf) => {
            basketball = gltf.scene
            // Smaller size to fit better
            basketball.scale.set(1.2, 1.2, 1.2)
            basketball.position.set(0, 0, 0)
            scene.add(basketball)
        },
        (progress) => {
            console.log('Loading:', (progress.loaded / progress.total * 100) + '%')
        },
        (error) => {
            console.error('Error loading model:', error)
        }
    )

    // Handle window resize
    window.addEventListener('resize', onWindowResize)
}

const onWindowResize = () => {
    if (container.value) {
        camera.aspect = container.value.clientWidth / container.value.clientHeight
        camera.updateProjectionMatrix()
        renderer.setSize(container.value.clientWidth, container.value.clientHeight)
    }
}

const animate = () => {
    animationId = requestAnimationFrame(animate)

    // Rotate basketball - slower and smoother
    if (basketball) {
        basketball.rotation.y += 0.005
        basketball.rotation.x += 0.002

        // Bounce physics
        if (isBouncing) {
            bounceVelocity -= 0.012  // Gravity - smoother
            basketball.position.y += bounceVelocity

            // Stop bouncing when back to normal position
            if (basketball.position.y <= 0) {
                basketball.position.y = 0
                bounceVelocity = 0
                isBouncing = false
            }
        } else {
            // Normal floating effect
            basketball.position.y = Math.sin(Date.now() * 0.0008) * 0.2
        }
    }

    renderer.render(scene, camera)
}
</script>

<style scoped>
.basketball-3d-viewer {
    width: 100%;
    height: 100%;
    position: relative;
    cursor: pointer;
}

.basketball-3d-viewer canvas {
    display: block;
}
</style>
