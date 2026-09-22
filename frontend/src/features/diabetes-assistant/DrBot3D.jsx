import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

// Simple in-memory cache for the loaded GLTF model data to ensure instant re-mounts
let cachedModel = null
let loadingPromise = null

function loadBotModel(url) {
  if (cachedModel) return Promise.resolve(cachedModel)
  if (loadingPromise) return loadingPromise

  const loader = new GLTFLoader()
  loadingPromise = new Promise((resolve, reject) => {
    loader.load(
      url,
      (gltf) => {
        cachedModel = gltf
        resolve(gltf)
      },
      undefined,
      (error) => {
        console.warn('Failed to load 3D robot model from', url, error)
        reject(error)
      }
    )
  })

  return loadingPromise
}

/**
 * Interactive 3D Robot Model Component using Three.js & WebGL.
 * Features:
 * - Transparent background
 * - Responsive auto-sizing & frustum fitting
 * - Subtle idle floating & breathing animation
 * - Pointer-tracking head/body glance
 * - Memory leak prevention & GPU resource cleanup
 */
export function DrBot3D({
  modelUrl = '/3d/dr-bot.glb',
  className = '',
  interactive = true,
  idleAnimation = true,
}) {
  const containerRef = useRef(null)
  const [hasError, setHasError] = useState(false)
  const [isLoaded, setIsLoaded] = useState(Boolean(cachedModel))
  const targetRotationRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let isDestroyed = false
    let animationFrameId = null
    let renderer = null
    let scene = null
    let camera = null
    let modelInstance = null
    const clock = new THREE.Clock()

    // 1. Scene setup
    scene = new THREE.Scene()

    // 2. Camera setup
    const aspect = (container.clientWidth || 80) / (container.clientHeight || 90)
    camera = new THREE.PerspectiveCamera(38, aspect, 0.1, 50)
    camera.position.set(0, 0.1, 3.6)

    // 3. Renderer setup
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      })
      renderer.setSize(container.clientWidth || 80, container.clientHeight || 90)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
      renderer.outputColorSpace = THREE.SRGBColorSpace
      container.appendChild(renderer.domElement)
    } catch (e) {
      console.warn('WebGL initialization failed:', e)
      setHasError(true)
      return
    }

    // 4. Lighting setup - crisp and clean
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4)
    scene.add(ambientLight)

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.8)
    mainLight.position.set(2, 4, 3)
    scene.add(mainLight)

    const blueRimLight = new THREE.DirectionalLight(0x60a5fa, 1.0)
    blueRimLight.position.set(-2, 2, -2)
    scene.add(blueRimLight)

    const fillLight = new THREE.DirectionalLight(0xe0f2fe, 0.8)
    fillLight.position.set(0, -2, 2)
    scene.add(fillLight)

    // 5. Load model
    loadBotModel(modelUrl)
      .then((gltf) => {
        if (isDestroyed) return

        // Clone the scene for this component instance
        modelInstance = gltf.scene.clone(true)

        // Compute bounds and auto-center
        const box = new THREE.Box3().setFromObject(modelInstance)
        const size = box.getSize(new THREE.Vector3())
        const center = box.getCenter(new THREE.Vector3())

        // Center on (0, 0, 0)
        modelInstance.position.x = -center.x
        modelInstance.position.y = -center.y
        modelInstance.position.z = -center.z

        // Normalize scale to fit nicely within camera view with breathing room
        const maxDim = Math.max(size.x, size.y, size.z)
        const scale = 1.6 / maxDim
        modelInstance.scale.setScalar(scale)

        const rootGroup = new THREE.Group()
        rootGroup.add(modelInstance)
        scene.add(rootGroup)

        setIsLoaded(true)

        // 6. Animation loop
        const animate = () => {
          if (isDestroyed) return
          animationFrameId = requestAnimationFrame(animate)

          const elapsed = clock.getElapsedTime()

          if (idleAnimation && rootGroup) {
            // Gentle hovering bob
            rootGroup.position.y = Math.sin(elapsed * 2.2) * 0.05
            // Subtle breathing tilt
            rootGroup.rotation.z = Math.sin(elapsed * 1.5) * 0.02
          }

          if (interactive && rootGroup) {
            // Smoothly ease towards pointer direction
            rootGroup.rotation.y += (targetRotationRef.current.y - rootGroup.rotation.y) * 0.08
            rootGroup.rotation.x += (targetRotationRef.current.x - rootGroup.rotation.x) * 0.08
          }

          renderer.render(scene, camera)
        }

        animate()
      })
      .catch((err) => {
        console.warn('3D Robot loading failed:', err)
        if (!isDestroyed) setHasError(true)
      })

    // Pointer movement tracking for interactive look-at
    const handlePointerMove = (event) => {
      if (!interactive) return
      const rect = container.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2

      // Calculate normalized offset (-1 to 1)
      const dx = (event.clientX - centerX) / (window.innerWidth / 2)
      const dy = (event.clientY - centerY) / (window.innerHeight / 2)

      // Clamp max rotation angle (in radians)
      targetRotationRef.current = {
        y: Math.max(-0.55, Math.min(0.55, dx * 0.7)),
        x: Math.max(-0.3, Math.min(0.3, dy * 0.4)),
      }
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: true })

    // Resize observer
    const handleResize = () => {
      if (!container || !renderer || !camera) return
      const width = container.clientWidth || 80
      const height = container.clientHeight || 90
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
    }

    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(container)

    // Cleanup
    return () => {
      isDestroyed = true
      window.removeEventListener('pointermove', handlePointerMove)
      resizeObserver.disconnect()
      if (animationFrameId) cancelAnimationFrame(animationFrameId)

      if (renderer) {
        renderer.dispose()
        if (renderer.domElement && renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement)
        }
      }

      if (scene) {
        scene.traverse((child) => {
          if (child.isMesh) {
            if (child.geometry) child.geometry.dispose()
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach((m) => m.dispose())
              } else {
                child.material.dispose()
              }
            }
          }
        })
      }
    }
  }, [modelUrl, interactive, idleAnimation])

  if (hasError) {
    // Fallback: render the png logo if 3D fails or WebGL is disabled
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <img
          src="/images/dr-bot.png"
          alt="Dr. Bot"
          className="h-full w-full object-contain pointer-events-none select-none"
          draggable={false}
        />
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={`relative select-none pointer-events-none ${className}`}
      style={{ width: '100%', height: '100%' }}
      aria-hidden="true"
    >
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <img
            src="/images/dr-bot.png"
            alt="Dr. Bot loading"
            className="h-full w-full object-contain opacity-50 animate-pulse"
          />
        </div>
      )}
    </div>
  )
}
