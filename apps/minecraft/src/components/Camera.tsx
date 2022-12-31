/* eslint-disable react/no-unknown-property */
import { useEffect, useRef } from "react"
import { useThree } from "@react-three/fiber"
import type { PerspectiveCamera } from "three"

interface CustomCameraProps {
  fov: number
}

export default function CustomCamera({ fov }: CustomCameraProps) {
  const ref = useRef<PerspectiveCamera>(null)
  const set = useThree((state) => state.set)

  useEffect(() => {
    if (ref.current !== null) {
      set({ camera: ref.current })
    }
  }, [set])

  return <perspectiveCamera ref={ref} fov={fov} />
}
