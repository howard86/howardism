/* eslint-disable react/no-unknown-property */
import { useState } from "react"
import { BoxProps, Triplet, useBox } from "@react-three/cannon"
import { useTexture } from "@react-three/drei"
import type { ThreeEvent } from "@react-three/fiber/dist/declarations/src/core/events"
import { nanoid } from "nanoid"
import { BufferGeometry, Mesh } from "three"
import create from "zustand"

interface CubeStore {
  cubes: (Element | JSX.Element)[]
  addCube: (x: number, y: number, z: number) => void
}

export const useCubeStore = create<CubeStore>((set) => ({
  cubes: [],
  addCube: (x, y, z) =>
    set((state) => ({
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      cubes: [...state.cubes, <Cube key={nanoid()} position={[x, y, z]} />],
    })),
}))

interface CubeProps {
  position: Triplet
}

export default function Cube({ position }: CubeProps) {
  const [hover, setHover] = useState<number | null>(null)
  const addCube = useCubeStore((state) => state.addCube)
  const [ref] = useBox<Mesh<BufferGeometry>>(() => ({
    type: "Static",
    position,
  }))

  const texture = useTexture("/texture/dirt.jpg")

  const handlePointerMove = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    if (event.faceIndex) {
      setHover(Math.floor(event.faceIndex / 2))
    }
  }

  const handlePointerOut = () => {
    setHover(null)
  }

  const handleOnClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()

    if (!event.faceIndex || !ref.current) {
      return
    }

    const faceIndex = Math.floor(event.faceIndex / 2)
    const { x, y, z } = ref.current.position

    switch (faceIndex) {
      case 4:
        addCube(x, y, z + 1)
        return

      case 2:
        addCube(x, y + 1, z)
        return

      case 1:
        addCube(x - 1, y, z)
        return

      case 5:
        addCube(x, y, z - 1)
        return

      case 3:
        addCube(x, y - 1, z)
        return

      default:
        addCube(x + 1, y, z)
    }
  }

  return (
    <mesh
      ref={ref}
      onPointerMove={handlePointerMove}
      onPointerOut={handlePointerOut}
      onClick={handleOnClick}
      castShadow
    >
      {/* eslint-disable-next-line react/jsx-no-useless-fragment */}
      <>
        {[...Array(6)].map(
          (_, index): BoxProps => (
            <meshStandardMaterial
              key={nanoid()}
              attach={`material-${index}`}
              map={texture}
              color={hover === index ? "gray" : "white"}
            />
          )
        )}
        <boxBufferGeometry attach="geometry" />
      </>
    </mesh>
  )
}
