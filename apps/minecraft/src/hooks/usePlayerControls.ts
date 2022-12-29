import { useEffect, useState } from "react"

interface Movement {
  moveForward: boolean
  moveBackward: boolean
  moveLeft: boolean
  moveRight: boolean
  jump: boolean
}

const DEFAULT_MOVEMENT: Movement = {
  moveForward: false,
  moveBackward: false,
  moveLeft: false,
  moveRight: false,
  jump: false,
}

type KeyMap = {
  [key in "KeyW" | "KeyS" | "KeyA" | "KeyD" | "Space"]: keyof Movement
}

const keyMapToMovement: KeyMap = {
  KeyW: "moveForward",
  KeyS: "moveBackward",
  KeyA: "moveLeft",
  KeyD: "moveRight",
  Space: "jump",
}

const usePlayerControls = (): Movement => {
  const [movement, setMovement] = useState<Movement>(DEFAULT_MOVEMENT)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      setMovement((move) => ({
        ...move,
        [keyMapToMovement[event.code as keyof KeyMap]]: true,
      }))
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      setMovement((move) => ({
        ...move,
        [keyMapToMovement[event.code as keyof KeyMap]]: false,
      }))
    }

    document.addEventListener("keydown", handleKeyDown)
    document.addEventListener("keyup", handleKeyUp)

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("keyup", handleKeyUp)
    }
  }, [])

  return movement
}

export default usePlayerControls
