import {
  Fn,
  Pausable,
  UseRafFnCallbackArguments,
  UseRafFnOptions,
} from "@/types/background"
import { useEffect, useRef, useState } from "react"

const r180 = Math.PI
const r90 = Math.PI / 2
const r15 = Math.PI / 12
const color = "#ccc"
const { random } = Math
const init = 4
const len = 6
/** 初始化canvas大小 */
function initCanvas(
  canvas: HTMLCanvasElement,
  width = 400,
  height = 400,
  _dpi?: number
) {
  const ctx = canvas.getContext("2d")!
  const dpr = window.devicePixelRatio || 1
  const bsr =
    ctx.webkitBackingStorePixelRatio ||
    ctx.mozBackingStorePixelRatio ||
    ctx.msBackingStorePixelRatio ||
    ctx.oBackingStorePixelRatio ||
    ctx.backingStorePixelRatio ||
    1
  // 比例
  const dpi = _dpi || dpr / bsr
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`
  canvas.width = dpi * width
  canvas.height = dpi * height
  ctx.scale(dpi, dpi)
  return { ctx, dpi }
}
/** 随机坐标点 */
function polar2cart(x = 0, y = 0, r = 0, theta = 0) {
  const dx = r * Math.cos(theta)
  const dy = r * Math.sin(theta)
  return [x + dx, y + dy]
}

const defaultWindow = typeof window !== "undefined" ? window : undefined

function useRafFn(
  fn: (args: UseRafFnCallbackArguments) => void,
  options: UseRafFnOptions = {}
): Pausable {
  const { immediate = true, window = defaultWindow } = options

  let previousFrameTimestamp = 0
  let rafId: null | number = null

  function loop(timestamp: DOMHighResTimeStamp) {
    if (!window) return

    const delta = timestamp - previousFrameTimestamp
    fn({ delta, timestamp })

    previousFrameTimestamp = timestamp
    rafId = window.requestAnimationFrame(loop)
  }

  function resume() {
    if (window) {
      rafId = window.requestAnimationFrame(loop)
    }
  }

  function pause() {
    if (rafId != null && window) {
      window.cancelAnimationFrame(rafId)
      rafId = null
    }
  }

  if (immediate) resume()

  return {
    pause,
    resume,
  }
}
export default function Background() {
  const elRef = useRef(null)
  const [size, setSize] = useState({
    width: 0,
    height: 0,
  })
  useEffect(() => {
    setSize({ width: window.innerWidth, height: window.innerHeight })
    const canvas = elRef.current!
    const { ctx } = initCanvas(canvas, size.width, size.height)
    const { width, height } = canvas
    let steps: Fn[] = []
    let prevSteps: Fn[] = []
    let iterations = 0
    const step = (x: number, y: number, rad: number) => {
      const length = random() * len
      const [nx, ny] = polar2cart(x, y, length, rad)
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(nx, ny)
      ctx.stroke()
      const rad1 = rad + random() * r15
      const rad2 = rad - random() * r15
      if (
        nx < -100 ||
        nx > size.width + 100 ||
        ny < -100 ||
        ny > size.height + 100
      )
        return
      if (iterations <= init || random() > 0.5)
        steps.push(() => step(nx, ny, rad1))
      if (iterations <= init || random() > 0.5)
        steps.push(() => step(nx, ny, rad2))
    }
    let lastTime = performance.now()
    const interval = 1000 / 40
    let controls: ReturnType<typeof useRafFn>
    const frame = () => {
      if (performance.now() - lastTime < interval) return
      iterations += 1
      prevSteps = steps
      steps = []
      lastTime = performance.now()
      if (!prevSteps.length) {
        controls.pause()
      }
      prevSteps.forEach((i) => i())
    }
    controls = useRafFn(frame, { immediate: false })
    controls.pause()
    iterations = 0
    ctx.clearRect(0, 0, width, height)
    ctx.lineWidth = 1
    ctx.strokeStyle = color
    prevSteps = []
    steps = [
      () => step(random() * size.width, 0, r90),
      () => step(random() * size.width, size.height, -r90),
      () => step(0, random() * size.height, 0),
      () => step(size.width, random() * size.height, r180),
    ]
    if (size.width < 500) steps = steps.slice(0, 2)
    controls.resume()
  }, [size.width, size.height])

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        pointerEvents: "none",
        zIndex: -1,
        mask: "radial-gradient(circle, transparent, black)",
      }}
    >
      <canvas ref={elRef} width={size.width} height={size.height} />
    </div>
  )
}
