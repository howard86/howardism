import { m as motion, useMotionValue, useSpring } from "framer-motion"
import throttle from "lodash.throttle"
import { useEffect } from "react"

const DEFAULT_POSITION = -100
const CURSOR_SIZE = 32
const CURSOR_POSITION = CURSOR_SIZE / 2
const SPRING_OPTIONS: Parameters<typeof useSpring>[1] = {
  mass: 3,
  damping: 27,
  stiffness: 100,
}

export default function Cursor() {
  const cursorX = useMotionValue(DEFAULT_POSITION)
  const cursorY = useMotionValue(DEFAULT_POSITION)

  useEffect(() => {
    const moveCursor = throttle((e: MouseEvent) => {
      cursorX.set(e.clientX - CURSOR_POSITION)
      cursorY.set(e.clientY - CURSOR_POSITION)
    }, 10)

    window.addEventListener("mousemove", moveCursor)

    return () => {
      window.removeEventListener("mousemove", moveCursor)
    }
  })

  return (
    <>
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-50 h-8 w-8 rounded-full bg-teal-900 mix-blend-difference"
        style={{
          translateX: useSpring(cursorX, SPRING_OPTIONS),
          translateY: useSpring(cursorY, SPRING_OPTIONS),
        }}
      />
      <motion.div
        className="pointer-events-none fixed left-3 top-3 z-50 h-2 w-2 rounded-full bg-teal-900/80 mix-blend-luminosity"
        style={{
          translateX: cursorX,
          translateY: cursorY,
        }}
      />
    </>
  )
}
